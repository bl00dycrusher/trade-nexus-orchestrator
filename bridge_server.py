import asyncio
import websockets
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AccountType(Enum):
    PROVIDER = "provider"
    COPYER = "copyer"
    BOTH = "both"

class Platform(Enum):
    MT5 = "mt5"
    CTRADER = "ctrader"

@dataclass
class Account:
    account_id: str
    platform: Platform
    account_type: AccountType
    display_name: str
    is_connected: bool = False
    websocket: Optional[object] = None
    
@dataclass
class TradeData:
    symbol: str
    action: str  # "BUY" or "SELL"
    volume: float
    price: float
    sl: float = 0.0
    tp: float = 0.0
    comment: str = ""
    magic_number: int = 0
    timestamp: str = ""

@dataclass
class Relationship:
    provider_id: str
    copyer_id: str
    volume_multiplier: float = 1.0
    is_active: bool = True

class TradingBridge:
    def __init__(self):
        self.accounts: Dict[str, Account] = {}
        self.relationships: List[Relationship] = []
        self.gui_connections: set = set()
        
    async def register_account(self, websocket, account_data):
        """Register a new trading account"""
        account = Account(
            account_id=account_data["account_id"],
            platform=Platform(account_data["platform"]),
            account_type=AccountType(account_data["account_type"]),
            display_name=account_data["display_name"],
            is_connected=True,
            websocket=websocket
        )
        
        self.accounts[account.account_id] = account
        logger.info(f"Account registered: {account.account_id} ({account.platform.value})")
        
        # Notify GUI of account registration
        await self.notify_gui({
            "type": "account_registered",
            "account": asdict(account)
        })
        
    async def handle_trade_signal(self, provider_id: str, trade_data: TradeData):
        """Process trade signal from provider and copy to related copyers"""
        logger.info(f"Trade signal from {provider_id}: {trade_data.symbol} {trade_data.action}")
        
        # Find all copyers related to this provider
        for relationship in self.relationships:
            if relationship.provider_id == provider_id and relationship.is_active:
                copyer_account = self.accounts.get(relationship.copyer_id)
                
                if copyer_account and copyer_account.is_connected:
                    # Adjust volume based on multiplier
                    adjusted_trade = TradeData(
                        symbol=trade_data.symbol,
                        action=trade_data.action,
                        volume=trade_data.volume * relationship.volume_multiplier,
                        price=trade_data.price,
                        sl=trade_data.sl,
                        tp=trade_data.tp,
                        comment=f"Copy from {provider_id}",
                        magic_number=trade_data.magic_number,
                        timestamp=datetime.now().isoformat()
                    )
                    
                    # Send trade to copyer
                    await self.send_trade_to_copyer(copyer_account, adjusted_trade)
                    
    async def send_trade_to_copyer(self, copyer_account: Account, trade_data: TradeData):
        """Send trade signal to copyer account"""
        try:
            message = {
                "type": "execute_trade",
                "trade_data": asdict(trade_data)
            }
            
            await copyer_account.websocket.send(json.dumps(message))
            logger.info(f"Trade sent to {copyer_account.account_id}")
            
            # Notify GUI
            await self.notify_gui({
                "type": "trade_copied",
                "from": trade_data.comment.split()[-1] if "Copy from" in trade_data.comment else "Unknown",
                "to": copyer_account.account_id,
                "trade": asdict(trade_data)
            })
            
        except Exception as e:
            logger.error(f"Failed to send trade to {copyer_account.account_id}: {e}")
            
    async def notify_gui(self, message):
        """Send message to all connected GUI clients"""
        if self.gui_connections:
            dead_connections = set()
            for gui_ws in self.gui_connections:
                try:
                    await gui_ws.send(json.dumps(message))
                except websockets.exceptions.ConnectionClosed:
                    dead_connections.add(gui_ws)
                    
            # Remove dead connections
            self.gui_connections -= dead_connections
            
    async def handle_gui_message(self, websocket, message):
        """Handle messages from GUI"""
        try:
            data = json.loads(message)
            message_type = data.get("type")
            
            if message_type == "get_accounts":
                accounts_data = [asdict(acc) for acc in self.accounts.values()]
                await websocket.send(json.dumps({
                    "type": "accounts_list",
                    "accounts": accounts_data
                }))
                
            elif message_type == "create_relationship":
                relationship = Relationship(
                    provider_id=data["provider_id"],
                    copyer_id=data["copyer_id"],
                    volume_multiplier=data.get("volume_multiplier", 1.0)
                )
                self.relationships.append(relationship)
                logger.info(f"Relationship created: {relationship.provider_id} -> {relationship.copyer_id}")
                
            elif message_type == "get_relationships":
                relationships_data = [asdict(rel) for rel in self.relationships]
                await websocket.send(json.dumps({
                    "type": "relationships_list",
                    "relationships": relationships_data
                }))
                
        except Exception as e:
            logger.error(f"Error handling GUI message: {e}")
            
    async def handle_trading_platform_message(self, websocket, message):
        """Handle messages from MT5/cTrader"""
        try:
            data = json.loads(message)
            message_type = data.get("type")
            
            if message_type == "register":
                await self.register_account(websocket, data)
                
            elif message_type == "trade_signal":
                trade_data = TradeData(**data["trade_data"])
                await self.handle_trade_signal(data["account_id"], trade_data)
                
            elif message_type == "heartbeat":
                account_id = data.get("account_id")
                if account_id in self.accounts:
                    self.accounts[account_id].is_connected = True
                    
        except Exception as e:
            logger.error(f"Error handling platform message: {e}")

# Global bridge instance
bridge = TradingBridge()

async def handle_client(websocket, path):
    """Handle new WebSocket connections"""
    logger.info(f"New connection: {websocket.remote_address}")
    
    try:
        # Determine connection type based on path
        if path.startswith("/gui"):
            bridge.gui_connections.add(websocket)
            logger.info("GUI connected")
            
            async for message in websocket:
                await bridge.handle_gui_message(websocket, message)
                
        elif path.startswith("/trading"):
            logger.info("Trading platform connected")
            
            async for message in websocket:
                await bridge.handle_trading_platform_message(websocket, message)
                
    except websockets.exceptions.ConnectionClosed:
        logger.info(f"Connection closed: {websocket.remote_address}")
    except Exception as e:
        logger.error(f"Error handling client: {e}")
    finally:
        # Clean up
        if websocket in bridge.gui_connections:
            bridge.gui_connections.remove(websocket)
            
        # Remove account if it was a trading platform
        for account_id, account in list(bridge.accounts.items()):
            if account.websocket == websocket:
                account.is_connected = False
                logger.info(f"Account disconnected: {account_id}")

async def main():
    """Start the bridge server"""
    logger.info("Starting Trading Bridge Server on ws://localhost:8765")
    
    start_server = websockets.serve(handle_client, "localhost", 8765)
    await start_server
    
    logger.info("Trading Bridge Server is running...")
    await asyncio.Future()  # Run forever

if __name__ == "__main__":
    asyncio.run(main())