using System;
using System.Text;
using System.Net.WebSockets;
using System.Threading;
using System.Threading.Tasks;
using System.Text.Json;
using cAlgo.API;
using cAlgo.API.Indicators;

namespace cAlgo.Robots
{
    [Robot(TimeZone = TimeZones.UTC, AccessRights = AccessRights.FullAccess)]
    public class cTraderBridgecBot : Robot
    {
        [Parameter("Server URL", DefaultValue = "ws://localhost:8765/trading")]
        public string ServerUrl { get; set; }

        [Parameter("Account Name", DefaultValue = "cTrader-001")]
        public string AccountName { get; set; }

        [Parameter("Account Type", DefaultValue = AccountType.Both)]
        public AccountType AccountType { get; set; }

        [Parameter("Magic Number", DefaultValue = 12345)]
        public int MagicNumber { get; set; }

        [Parameter("Max Lot Size", DefaultValue = 10.0)]
        public double MaxLotSize { get; set; }

        [Parameter("Enable Logging", DefaultValue = true)]
        public bool EnableLogging { get; set; }

        private ClientWebSocket _webSocket;
        private CancellationTokenSource _cancellationTokenSource;
        private string _accountId;
        private bool _isConnected = false;
        private DateTime _lastHeartbeat = DateTime.MinValue;

        public enum AccountType
        {
            Provider,
            Copyer,
            Both
        }

        protected override void OnStart()
        {
            _accountId = $"{AccountName}_{Account.Number}";
            _cancellationTokenSource = new CancellationTokenSource();

            if (EnableLogging)
                Print($"cTrader Bridge cBot initialized for account: {_accountId}");

            // Start connection task
            Task.Run(async () => await ConnectToBridge());

            // Start heartbeat timer
            Timer.Start(TimeSpan.FromSeconds(5));
        }

        protected override void OnStop()
        {
            _cancellationTokenSource?.Cancel();
            _webSocket?.Dispose();

            if (EnableLogging)
                Print("cTrader Bridge cBot stopped");
        }

        protected override void OnTimer()
        {
            // Send heartbeat every 30 seconds
            if (_isConnected && DateTime.UtcNow.Subtract(_lastHeartbeat).TotalSeconds > 30)
            {
                Task.Run(async () => await SendHeartbeat());
                _lastHeartbeat = DateTime.UtcNow;
            }

            // Check connection
            if (!_isConnected)
            {
                Task.Run(async () => await ConnectToBridge());
            }
        }

        protected override void OnPositionOpened(PositionOpenedEventArgs args)
        {
            // Only send trade signals if account is a provider
            if (AccountType == AccountType.Provider || AccountType == AccountType.Both)
            {
                if (args.Position.Label.Contains(MagicNumber.ToString()) || 
                    args.Position.Comment.Contains("Bridge"))
                {
                    Task.Run(async () => await SendTradeSignal(args.Position));
                }
            }
        }

        private async Task ConnectToBridge()
        {
            if (_isConnected || _webSocket?.State == WebSocketState.Open)
                return;

            try
            {
                _webSocket?.Dispose();
                _webSocket = new ClientWebSocket();

                var uri = new Uri(ServerUrl);
                await _webSocket.ConnectAsync(uri, _cancellationTokenSource.Token);

                _isConnected = true;
                
                if (EnableLogging)
                    Print("Connected to bridge server");

                // Register account
                await RegisterAccount();

                // Start listening for messages
                _ = Task.Run(async () => await ListenForMessages());
            }
            catch (Exception ex)
            {
                _isConnected = false;
                if (EnableLogging)
                    Print($"Failed to connect to bridge server: {ex.Message}");
            }
        }

        private async Task RegisterAccount()
        {
            if (!_isConnected)
                return;

            var accountTypeStr = AccountType switch
            {
                AccountType.Provider => "provider",
                AccountType.Copyer => "copyer",
                AccountType.Both => "both",
                _ => "both"
            };

            var message = new
            {
                type = "register",
                account_id = _accountId,
                platform = "ctrader",
                account_type = accountTypeStr,
                display_name = AccountName
            };

            await SendMessage(JsonSerializer.Serialize(message));
        }

        private async Task SendHeartbeat()
        {
            var message = new
            {
                type = "heartbeat",
                account_id = _accountId,
                timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
            };

            await SendMessage(JsonSerializer.Serialize(message));
        }

        private async Task SendTradeSignal(Position position)
        {
            var tradeData = new
            {
                symbol = position.SymbolName,
                action = position.TradeType == TradeType.Buy ? "BUY" : "SELL",
                volume = VolumeInUnitsToQuantity(position.VolumeInUnits),
                price = position.EntryPrice,
                sl = position.StopLoss ?? 0.0,
                tp = position.TakeProfit ?? 0.0,
                comment = position.Comment ?? "",
                magic_number = MagicNumber,
                timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
            };

            var message = new
            {
                type = "trade_signal",
                account_id = _accountId,
                trade_data = tradeData
            };

            await SendMessage(JsonSerializer.Serialize(message));

            if (EnableLogging)
                Print($"Trade signal sent: {position.SymbolName} {position.TradeType} {VolumeInUnitsToQuantity(position.VolumeInUnits)}");
        }

        private async Task ListenForMessages()
        {
            var buffer = new byte[4096];

            try
            {
                while (_webSocket.State == WebSocketState.Open && !_cancellationTokenSource.Token.IsCancellationRequested)
                {
                    var result = await _webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), _cancellationTokenSource.Token);

                    if (result.MessageType == WebSocketMessageType.Text)
                    {
                        var message = Encoding.UTF8.GetString(buffer, 0, result.Count);
                        await ProcessMessage(message);
                    }
                    else if (result.MessageType == WebSocketMessageType.Close)
                    {
                        _isConnected = false;
                        break;
                    }
                }
            }
            catch (Exception ex)
            {
                _isConnected = false;
                if (EnableLogging)
                    Print($"Error listening for messages: {ex.Message}");
            }
        }

        private async Task ProcessMessage(string message)
        {
            try
            {
                using var document = JsonDocument.Parse(message);
                var root = document.RootElement;

                if (root.TryGetProperty("type", out var typeElement) && 
                    typeElement.GetString() == "execute_trade")
                {
                    // Only execute trades if account is a copyer
                    if (AccountType == AccountType.Copyer || AccountType == AccountType.Both)
                    {
                        await ExecuteReceivedTrade(root);
                    }
                }

                if (EnableLogging)
                    Print($"Received message: {message}");
            }
            catch (Exception ex)
            {
                if (EnableLogging)
                    Print($"Error processing message: {ex.Message}");
            }
        }

        private async Task ExecuteReceivedTrade(JsonElement messageRoot)
        {
            try
            {
                if (!messageRoot.TryGetProperty("trade_data", out var tradeDataElement))
                    return;

                var symbol = tradeDataElement.GetProperty("symbol").GetString();
                var action = tradeDataElement.GetProperty("action").GetString();
                var volume = tradeDataElement.GetProperty("volume").GetDouble();
                var sl = tradeDataElement.TryGetProperty("sl", out var slElement) ? slElement.GetDouble() : 0.0;
                var tp = tradeDataElement.TryGetProperty("tp", out var tpElement) ? tpElement.GetDouble() : 0.0;

                // Validate symbol
                var symbolObj = Symbols.GetSymbol(symbol);
                if (symbolObj == null)
                {
                    if (EnableLogging)
                        Print($"Symbol not found: {symbol}");
                    return;
                }

                // Validate and adjust volume
                var volumeInUnits = symbolObj.QuantityToVolumeInUnits(volume);
                volumeInUnits = Math.Max(symbolObj.VolumeInUnitsMin, 
                                Math.Min(symbolObj.VolumeInUnitsMax, volumeInUnits));

                // Validate lot size against our maximum
                var adjustedVolume = VolumeInUnitsToQuantity(volumeInUnits);
                if (adjustedVolume > MaxLotSize)
                {
                    volumeInUnits = symbolObj.QuantityToVolumeInUnits(MaxLotSize);
                }

                // Execute trade
                TradeResult result = null;
                var label = $"Bridge_{MagicNumber}";
                var comment = "Copy trade";

                if (action == "BUY")
                {
                    if (sl > 0 && tp > 0)
                        result = ExecuteMarketOrder(TradeType.Buy, symbol, volumeInUnits, label, sl, tp, comment);
                    else if (sl > 0)
                        result = ExecuteMarketOrder(TradeType.Buy, symbol, volumeInUnits, label, sl, null, comment);
                    else if (tp > 0)
                        result = ExecuteMarketOrder(TradeType.Buy, symbol, volumeInUnits, label, null, tp, comment);
                    else
                        result = ExecuteMarketOrder(TradeType.Buy, symbol, volumeInUnits, label, null, null, comment);
                }
                else if (action == "SELL")
                {
                    if (sl > 0 && tp > 0)
                        result = ExecuteMarketOrder(TradeType.Sell, symbol, volumeInUnits, label, sl, tp, comment);
                    else if (sl > 0)
                        result = ExecuteMarketOrder(TradeType.Sell, symbol, volumeInUnits, label, sl, null, comment);
                    else if (tp > 0)
                        result = ExecuteMarketOrder(TradeType.Sell, symbol, volumeInUnits, label, null, tp, comment);
                    else
                        result = ExecuteMarketOrder(TradeType.Sell, symbol, volumeInUnits, label, null, null, comment);
                }

                if (EnableLogging)
                {
                    if (result != null && result.IsSuccessful)
                        Print($"Trade executed successfully: {symbol} {action} {adjustedVolume}");
                    else
                        Print($"Trade execution failed: {result?.Error}");
                }
            }
            catch (Exception ex)
            {
                if (EnableLogging)
                    Print($"Error executing trade: {ex.Message}");
            }
        }

        private async Task SendMessage(string message)
        {
            if (!_isConnected || _webSocket?.State != WebSocketState.Open)
                return;

            try
            {
                var buffer = Encoding.UTF8.GetBytes(message);
                await _webSocket.SendAsync(new ArraySegment<byte>(buffer), 
                                         WebSocketMessageType.Text, 
                                         true, 
                                         _cancellationTokenSource.Token);
            }
            catch (Exception ex)
            {
                _isConnected = false;
                if (EnableLogging)
                    Print($"Error sending message: {ex.Message}");
            }
        }

        private double VolumeInUnitsToQuantity(long volumeInUnits)
        {
            return Symbol.VolumeInUnitsToQuantity(volumeInUnits);
        }
    }
}