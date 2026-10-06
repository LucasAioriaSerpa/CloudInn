# Diagrama de Classes do Backend — CloudInn

Este documento apresenta o diagrama de classes arquitetural dos microsserviços do backend do **CloudInn**: o **Reservas Service** (responsável por hóspedes e reservas, integrado ao **Azure SQL / Atlas SQL**) e o **Hotel Service** (responsável por quartos, diárias, taxas, funcionários, check-in, check-out e governança, integrado ao **MongoDB Atlas**).

A modelagem é organizada com base nos princípios de **Vertical Slice Architecture** e **Clean Architecture**, demonstrando a independência de cada fatia vertical (_slice_), o encapsulamento de comandos, consultas, validadores, manipuladores (_handlers_), entidades de domínio e abstrações de infraestrutura.

---

## 1. Diagrama de Classes Geral por Vertical Slices

```mermaid
---
config:
  theme: mc
---
classDiagram
    direction LR

    namespace Reservas_Service {
        class Reservation {
            +Guid Id
            +string Code
            +Guid GuestId
            +string RoomNumber
            +DateTime CheckIn
            +DateTime CheckOut
            +ReservationStatus Status
            +Confirm() void
            +Cancel() void
        }

        class Guest {
            +Guid Id
            +string Name
            +string Document
        }

        class ReservationStatus {
            <<enumeration>>
            PENDING
            CONFIRMED
            CANCELLED
        }

        class ReservationHandler {
            +CreateReservation() Reservation
            +CancelReservation() void
        }

        class IReservationRepository {
            <<interface>>
            +Save(Reservation) void
            +GetById(Guid) Reservation
        }

        class ReservationSqlRepository
        class HotelServiceClient
        class EventPublisher
    }

    namespace Hotel_Service {
        class Room {
            +string Number
            +RoomStatus Status
            +decimal DailyRate
            +Occupy() void
            +MakeAvailable() void
        }

        class RoomStatus {
            <<enumeration>>
            AVAILABLE
            RESERVED
            OCCUPIED
            CLEANING
        }

        class HotelHandler {
            +CheckIn() void
            +CheckOut() void
            +UpdateRoomStatus() void
        }

        class IRoomRepository {
            <<interface>>
            +GetByNumber(string) Room
            +Update(Room) void
        }

        class RoomMongoRepository
    }

    ReservationHandler --> IReservationRepository : persiste
    ReservationHandler --> HotelServiceClient : consulta quarto
    ReservationHandler --> EventPublisher : publica eventos
    ReservationSqlRepository ..|> IReservationRepository : implementa
    Reservation --> Guest : hóspede
    Reservation --> ReservationStatus : status

    HotelHandler --> IRoomRepository : atualiza quarto
    RoomMongoRepository ..|> IRoomRepository : implementa
    Room --> RoomStatus : status

    HotelServiceClient ..> HotelHandler : REST
```

---

## 2. Destaques de Arquitetura de Classes

1. **Vertical Slice Architecture**: Cada funcionalidade possui seu próprio _Command_ ou _Query_, _Validator_, _Handler_ e _DTO_, eliminando acoplamentos horizontais entre casos de uso não correlacionados.
2. **Clean Architecture e Dependency Inversion**: Os _Handlers_ dependem unicamente de interfaces (`IReservationRepository`, `IRoomRepository`, `IEventPublisher`), enquanto as classes de persistência (`ReservationSqlRepository` e `RoomMongoRepository`) residem na camada de infraestrutura.
3. **Persistência Poliglota Especializada**:
   - `ReservationSqlRepository` e `GuestSqlRepository` utilizam **Azure SQL** para transações atômicas ACID, garantindo invariantes financeiras e evitando _overbooking_.
   - `RoomMongoRepository`, `CleaningTaskMongoRepository` e `StaffMongoRepository` utilizam **MongoDB Atlas** para estruturas flexíveis de documentos, histórico de auditoria e alta performance de consulta.
