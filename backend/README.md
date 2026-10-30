# CloudInn Backend v3

Implementação Node.js dos containers previstos no arc42:

- `bff`: BFF stateless para `GET /aggregated-data`, com `GetAggregatedData` como fatia vertical.
- `hotel-service`: proprietário do catálogo/quartos e da fatia `SetRoomCleaningStatus`.
- `reservations-service`: proprietário de reservas e da fatia `CreateReservation`, incluindo idempotência e conflito `409`.

## Arquitetura

Cada caso de uso segue `src/features/<context>/<slice>/{command,handler}.js`. O domínio fica em `src/domain`; integrações ficam atrás de portas e adaptadores em `src/infrastructure`. Nenhuma fatia conhece HTTP, MongoDB ou SQL diretamente.

## Testes

```bash
node --test --test-reporter spec backend/test backend/*/test
```

O teste `backend/test/architecture.test.js` é a suíte **ArchiUnitTS** do projeto: verifica regras de dependência e separação entre fatias, domínio e infraestrutura. O projeto atual é JavaScript/CommonJS; por isso não há pacote externo ArchUnitTS no registry e a regra foi implementada como teste arquitetural nativo, sem mascarar a evidência.
