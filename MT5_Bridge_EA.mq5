//+------------------------------------------------------------------+
//|                                                 MT5_Bridge_EA.mq5 |
//|                                  Trading Bridge EA for MT5       |
//|                                                                  |
//+------------------------------------------------------------------+
#property copyright "Trading Bridge"
#property link      ""
#property version   "1.00"
#property strict

#include <Trade\Trade.mqh>

// Custom enum for account types
enum ENUM_ACCOUNT_TYPE
{
   ACCOUNT_TYPE_PROVIDER = 0,  // Provider only
   ACCOUNT_TYPE_COPYER = 1,    // Copyer only  
   ACCOUNT_TYPE_BOTH = 2       // Both Provider and Copyer
};

// Input parameters
input string    InpServerURL = "ws://localhost:8765/trading";
input string    InpAccountName = "MT5-001";
input ENUM_ACCOUNT_TYPE InpAccountType = ACCOUNT_TYPE_BOTH; // PROVIDER, COPYER, BOTH
input int       InpMagicNumber = 12345;
input double    InpMaxLotSize = 10.0;
input bool      InpEnableLogging = true;

// Global variables
CTrade trade;
int file_handle = INVALID_HANDLE;
string account_id;
datetime last_heartbeat = 0;
bool is_connected = false;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   // Set account ID
   account_id = InpAccountName + "_" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
   
   // Initialize trade object
   trade.SetExpertMagicNumber(InpMagicNumber);
   trade.SetDeviationInPoints(10);
   trade.SetTypeFilling(ORDER_FILLING_IOC);
   
   // Connect to bridge server
   ConnectToBridge();
   
   // Set timer for heartbeat and connection check
   EventSetTimer(5); // 5 seconds
   
   if(InpEnableLogging)
      Print("MT5 Bridge EA initialized for account: ", account_id);
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
   
   if(file_handle != INVALID_HANDLE)
   {
      FileClose(file_handle);
      file_handle = INVALID_HANDLE;
   }
   
   if(InpEnableLogging)
      Print("MT5 Bridge EA deinitialized");
}

//+------------------------------------------------------------------+
//| Timer function                                                   |
//+------------------------------------------------------------------+
void OnTimer()
{
   // Send heartbeat
   if(is_connected && TimeCurrent() - last_heartbeat > 30)
   {
      SendHeartbeat();
      last_heartbeat = TimeCurrent();
   }
   
   // Check connection
   if(!is_connected)
   {
      ConnectToBridge();
   }
   
   // Process incoming messages
   ProcessIncomingMessages();
}

//+------------------------------------------------------------------+
//| Trade function                                                   |
//+------------------------------------------------------------------+
void OnTrade()
{
   // Only send trade signals if account is a provider
   if(InpAccountType == ACCOUNT_TYPE_PROVIDER || InpAccountType == ACCOUNT_TYPE_BOTH)
   {
      // Check for new trades and send signals
      CheckForNewTrades();
   }
}

//+------------------------------------------------------------------+
//| Connect to bridge server                                        |
//+------------------------------------------------------------------+
void ConnectToBridge()
{
   if(is_connected)
      return;
      
   // Use file-based communication instead of WebSocket
   string filename = "bridge_mt5_" + account_id + ".txt";
   file_handle = FileOpen(filename, FILE_WRITE|FILE_READ|FILE_TXT|FILE_COMMON);
   
   if(file_handle != INVALID_HANDLE)
   {
      is_connected = true;
      RegisterAccount();
      
      if(InpEnableLogging)
         Print("Connected to bridge server via file: ", filename);
   }
   else
   {
      if(InpEnableLogging)
         Print("Failed to create bridge file: ", filename);
   }
}

//+------------------------------------------------------------------+
//| Register account with bridge                                    |
//+------------------------------------------------------------------+
void RegisterAccount()
{
   if(!is_connected)
      return;
      
   string account_type_str;
   switch(InpAccountType)
   {
      case ACCOUNT_TYPE_PROVIDER: account_type_str = "provider"; break;
      case ACCOUNT_TYPE_COPYER: account_type_str = "copyer"; break;
      case ACCOUNT_TYPE_BOTH: account_type_str = "both"; break;
   }
   
   string message = StringFormat(
      "{\"type\":\"register\",\"account_id\":\"%s\",\"platform\":\"mt5\",\"account_type\":\"%s\",\"display_name\":\"%s\"}",
      account_id,
      account_type_str,
      InpAccountName
   );
   
   SendMessage(message);
}

//+------------------------------------------------------------------+
//| Send heartbeat                                                   |
//+------------------------------------------------------------------+
void SendHeartbeat()
{
   string message = StringFormat(
      "{\"type\":\"heartbeat\",\"account_id\":\"%s\",\"timestamp\":\"%s\"}",
      account_id,
      TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS)
   );
   
   SendMessage(message);
}

//+------------------------------------------------------------------+
//| Check for new trades to signal                                  |
//+------------------------------------------------------------------+
void CheckForNewTrades()
{
   static datetime last_check = 0;
   
   // Only check for trades opened in the last minute
   if(TimeCurrent() - last_check < 60)
      return;
      
   last_check = TimeCurrent();
   
   // Get recent positions
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      string symbol = PositionGetSymbol(i);
      if(PositionSelect(symbol))
      {
         if(PositionGetInteger(POSITION_MAGIC) == InpMagicNumber)
         {
            datetime open_time = (datetime)PositionGetInteger(POSITION_TIME);
            
            // Only signal trades opened in the last 2 minutes
            if(TimeCurrent() - open_time < 120)
            {
               SendTradeSignal();
            }
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Send trade signal                                               |
//+------------------------------------------------------------------+
void SendTradeSignal()
{
   string symbol = PositionGetString(POSITION_SYMBOL);
   ENUM_POSITION_TYPE pos_type = (ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE);
   double volume = PositionGetDouble(POSITION_VOLUME);
   double open_price = PositionGetDouble(POSITION_PRICE_OPEN);
   double sl = PositionGetDouble(POSITION_SL);
   double tp = PositionGetDouble(POSITION_TP);
   string comment = PositionGetString(POSITION_COMMENT);
   
   string action = (pos_type == POSITION_TYPE_BUY) ? "BUY" : "SELL";
   
   string message = StringFormat(
      "{\"type\":\"trade_signal\",\"account_id\":\"%s\",\"trade_data\":{\"symbol\":\"%s\",\"action\":\"%s\",\"volume\":%.2f,\"price\":%.5f,\"sl\":%.5f,\"tp\":%.5f,\"comment\":\"%s\",\"magic_number\":%d,\"timestamp\":\"%s\"}}",
      account_id,
      symbol,
      action,
      volume,
      open_price,
      sl,
      tp,
      comment,
      InpMagicNumber,
      TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS)
   );
   
   SendMessage(message);
   
   if(InpEnableLogging)
      Print("Trade signal sent: ", symbol, " ", action, " ", volume);
}

//+------------------------------------------------------------------+
//| Process incoming messages                                        |
//+------------------------------------------------------------------+
void ProcessIncomingMessages()
{
   if(!is_connected || file_handle == INVALID_HANDLE)
      return;
      
   // Read commands from file
   string filename = "bridge_commands_" + account_id + ".txt";
   int cmd_handle = FileOpen(filename, FILE_READ|FILE_TXT|FILE_COMMON);
   
   if(cmd_handle != INVALID_HANDLE)
   {
      if(FileSize(cmd_handle) > 0)
      {
         string message = FileReadString(cmd_handle);
         if(StringLen(message) > 0)
         {
            ProcessMessage(message);
            FileClose(cmd_handle);
            // Clear the file after reading
            FileDelete(filename, FILE_COMMON);
         }
      }
      else
      {
         FileClose(cmd_handle);
      }
   }
}

//+------------------------------------------------------------------+
//| Process received message                                         |
//+------------------------------------------------------------------+
void ProcessMessage(string message)
{
   // Parse JSON message (simplified - use proper JSON library)
   if(StringFind(message, "execute_trade") >= 0)
   {
      // Only execute trades if account is a copyer
      if(InpAccountType == ACCOUNT_TYPE_COPYER || InpAccountType == ACCOUNT_TYPE_BOTH)
      {
         ExecuteReceivedTrade(message);
      }
   }
   
   if(InpEnableLogging)
      Print("Received message: ", message);
}

//+------------------------------------------------------------------+
//| Execute received trade                                           |
//+------------------------------------------------------------------+
void ExecuteReceivedTrade(string message)
{
   // Parse trade data from message (simplified JSON parsing)
   // In real implementation, use proper JSON parsing library
   
   string symbol = "EURUSD"; // Extract from message
   string action = "BUY";    // Extract from message  
   double volume = 0.1;      // Extract from message
   double price = 0.0;       // Extract from message (0 for market price)
   double sl = 0.0;          // Extract from message
   double tp = 0.0;          // Extract from message
   
   // Validate lot size
   double min_lot = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MIN);
   double max_lot = MathMin(SymbolInfoDouble(symbol, SYMBOL_VOLUME_MAX), InpMaxLotSize);
   volume = MathMax(min_lot, MathMin(max_lot, volume));
   
   // Execute trade
   bool result = false;
   
   if(action == "BUY")
   {
      result = trade.Buy(volume, symbol, price, sl, tp, "Copy trade");
   }
   else if(action == "SELL")
   {
      result = trade.Sell(volume, symbol, price, sl, tp, "Copy trade");
   }
   
   if(InpEnableLogging)
   {
      if(result)
         Print("Trade executed successfully: ", symbol, " ", action, " ", volume);
      else
         Print("Trade execution failed: ", trade.ResultRetcode(), " - ", trade.ResultRetcodeDescription());
   }
}

//+------------------------------------------------------------------+
//| Send message to bridge                                          |
//+------------------------------------------------------------------+
void SendMessage(string message)
{
   if(!is_connected || file_handle == INVALID_HANDLE)
      return;
      
   // Write message to output file
   string out_filename = "bridge_out_" + account_id + ".txt";
   int out_handle = FileOpen(out_filename, FILE_WRITE|FILE_TXT|FILE_COMMON);
   
   if(out_handle != INVALID_HANDLE)
   {
      FileWrite(out_handle, message);
      FileClose(out_handle);
      
      if(InpEnableLogging)
         Print("Message sent to bridge: ", StringLen(message), " chars");
   }
   else
   {
      if(InpEnableLogging)
         Print("Failed to write message to bridge file");
   }
}