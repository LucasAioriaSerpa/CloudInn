# CloudInn Analytics Function (Azure Functions v4, Node 22)

Duas funções:

- `httpTriggerAnalytics` — `POST /api/httpTriggerAnalytics` (auth por function key, enviada no cabeçalho `x-functions-key`). Calcula ocupação, ADR, RevPAR e projeção. Chamada pelo BFF em `GET /aggregated-data`.
- `projectEvents` — trigger do Service Bus (`cloudinn.domain.events` / `sub-analytics-worker`). Valida o CloudEvent e registra uma linha de log por evento, com tipo, id, assunto e `correlationId` (consulte em Application Insights ou no Log stream). Não há persistência própria: os indicadores são calculados sob demanda pelo HTTP Trigger.

Payload de exemplo:

```json
{ "hotelId": "h1", "date": "2026-11-09", "totalRooms": 10, "occupiedRooms": 8, "roomRevenue": 1600, "daysInMonth": 30 }
```

Resposta: `{ "hotelId":"h1", "occupancyRate":80, "adr":200, "revPar":160, "projectedRevenue":48000, ... }`

## Rodar local

```bash
npm install
npm test
cp local.settings.json.example local.settings.json   # preencher SERVICEBUS_CONNECTION
func start        # requer Azure Functions Core Tools v4
```

## Publicar no Azure (CLI)

```bash
az storage account create -g rg-cloudinn -n stcloudinnfn<sufixo> -l brazilsouth --sku Standard_LRS
az functionapp create -g rg-cloudinn -n func-cloudinn-analytics-<sufixo> \
  --storage-account stcloudinnfn<sufixo> --flexconsumption-location brazilsouth \
  --runtime node --runtime-version 22
az functionapp config appsettings set -g rg-cloudinn -n func-cloudinn-analytics-<sufixo> \
  --settings "SERVICEBUS_CONNECTION=<connection string analytics-func>"
func azure functionapp publish func-cloudinn-analytics-<sufixo>
```

Pegue a chave: Portal → Function App → **App keys** (ou Functions → httpTriggerAnalytics → *Function Keys*).
Teste: `curl -X POST "https://<app>.azurewebsites.net/api/httpTriggerAnalytics?code=<KEY>" -H "Content-Type: application/json" -d '{"totalRooms":10,"occupiedRooms":8,"roomRevenue":1600}'`
