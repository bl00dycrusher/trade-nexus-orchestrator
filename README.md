# Trading Bridge - MT5 ↔ cTrader Communication System

A professional trading bridge system that enables real-time communication and trade copying between MetaTrader 5 (MT5) and cTrader platforms.

## Components

### 1. Python Bridge Server (`bridge_server.py`)
The central WebSocket server that handles communication between all components.

**Features:**
- WebSocket server on port 8765
- Account registration and management
- Relationship configuration (Provider/Copyer/Both)
- Real-time trade signal processing
- GUI communication
- Heartbeat monitoring

**Endpoints:**
- `/gui` - For web GUI connections
- `/trading` - For MT5/cTrader platform connections

### 2. MT5 Expert Advisor (`MT5_Bridge_EA.mq5`)
Expert Advisor for MetaTrader 5 that connects to the bridge server.

**Features:**
- WebSocket connection to bridge server
- Configurable account type (Provider/Copyer/Both)
- Trade signal transmission
- Trade execution from received signals
- Automatic reconnection
- Heartbeat monitoring

**Parameters:**
- `InpServerURL`: Bridge server URL (default: ws://localhost:8765/trading)
- `InpAccountName`: Display name for the account
- `InpAccountType`: Account role (Provider/Copyer/Both)
- `InpMagicNumber`: Magic number for trade identification
- `InpMaxLotSize`: Maximum lot size for copying trades
- `InpEnableLogging`: Enable/disable logging

### 3. cTrader cBot (`cTrader_Bridge_cBot.cs`)
cBot for cTrader platform that connects to the bridge server.

**Features:**
- WebSocket connection to bridge server
- Configurable account type (Provider/Copyer/Both)
- Trade signal transmission
- Trade execution from received signals
- Automatic reconnection
- Heartbeat monitoring

**Parameters:**
- `ServerUrl`: Bridge server URL
- `AccountName`: Display name for the account
- `AccountType`: Account role (Provider/Copyer/Both)
- `MagicNumber`: Magic number for trade identification
- `MaxLotSize`: Maximum lot size for copying trades
- `EnableLogging`: Enable/disable logging

### 4. Web GUI
React-based web interface for managing the trading bridge.

**Features:**
- Real-time connection status monitoring
- Account management and registration
- Relationship configuration between accounts
- Trade monitoring and activity logs
- Responsive design with dark/light mode

## Setup Instructions

### 1. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 2. Start the Bridge Server
```bash
python bridge_server.py
```
The server will start on `ws://localhost:8765`

### 3. Setup MT5 Expert Advisor
1. Copy `MT5_Bridge_EA.mq5` to your MT5 `MQL5/Experts/` folder
2. Compile the EA in MetaEditor
3. Attach to chart and configure parameters
4. Ensure WebSocket connections are allowed in MT5 settings

### 4. Setup cTrader cBot
1. Copy `cTrader_Bridge_cBot.cs` to your cTrader cBot project
2. Build the cBot in cTrader Automate
3. Add to chart and configure parameters
4. Ensure network access is allowed in cTrader settings

### 5. Access Web GUI
Start the React development server and access the web interface to manage accounts and relationships.

```sh
npm i
npm run dev
```

## Configuration

### Account Types
- **Provider**: Only sends trade signals to copyers
- **Copyer**: Only receives and executes trade signals
- **Both**: Can both send and receive trade signals

### Relationships
Configure which Provider accounts send signals to which Copyer accounts, including volume multipliers for risk management.

## Security Considerations

- The system runs on localhost by default
- For production use, implement proper authentication
- Use SSL/TLS for encrypted connections
- Validate all incoming trade signals
- Implement proper error handling and logging

## Troubleshooting

### Connection Issues
1. Ensure bridge server is running
2. Check firewall settings
3. Verify WebSocket support in trading platforms
4. Check server logs for error messages

### Trade Execution Issues
1. Verify account permissions
2. Check symbol availability
3. Validate lot sizes and trading hours
4. Review magic number configuration

## Technologies Used

This project is built with:

- **Backend**: Python with WebSockets
- **Frontend**: React, TypeScript, Vite
- **UI**: shadcn-ui, Tailwind CSS
- **MT5**: MQL5 Expert Advisor
- **cTrader**: C# cBot

## Support

For issues and questions, check the logs for detailed error messages and ensure all components are properly configured.
