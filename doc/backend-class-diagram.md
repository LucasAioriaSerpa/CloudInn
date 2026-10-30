# Diagrama de Classes do Backend — CloudInn

Este documento apresenta o diagrama de classes arquitetural dos microsserviços do backend do **CloudInn**: o **Reservas Service** (responsável por hóspedes e reservas, integrado ao **Azure SQL / Atlas SQL**) e o **Hotel Service** (responsável por quartos, diárias, taxas, funcionários, check-in, check-out e governança, integrado ao **MongoDB Atlas**).

A modelagem é organizada com base nos princípios de **Vertical Slice Architecture** e **Clean Architecture**, demonstrando a independência de cada fatia vertical (_slice_), o encapsulamento de comandos, consultas, validadores, manipuladores (_handlers_), entidades de domínio e abstrações de infraestrutura.

---

## 1. Diagrama de Classes Geral por Vertical Slices

```mermaid
classDiagram
    direction TB

    namespace Reservas {
        class Reservation {
            +Guid Id
            +string ReservationCode
            +Guid GuestId
            +string RoomNumber
            +DateTime CheckInDate
            +DateTime CheckOutDate
            +ReservationStatus Status
            +Confirm() void
            +Cancel(string reason) void
        }
        class Guest {
            +Guid Id
            +string Document
            +string Name
            +string Email
        }
        class ReservationStatus {
            <<enumeration>>
            PENDING
            CONFIRMED
            ACTIVE
            COMPLETED
            CANCELLED
        }
        class IReservationRepository {
            <<interface>>
            +GetByIdAsync(Guid id) Reservation
            +AddAsync(Reservation reservation) void
            +UpdateAsync(Reservation reservation) void
        }
        class IGuestRepository {
            <<interface>>
            +GetByDocumentAsync(string document) Guest
            +AddAsync(Guest guest) void
        }
        class CreateReservationHandler {
            +Handle(CreateReservationCommand cmd) ReservationResultDto
        }
        class IHotelServiceClient {
            <<interface>>
            +CheckRoomAvailabilityAsync(string roomNumber, DateTime start, DateTime end) bool
        }
    }

    namespace Hotel {
        class Room {
            +string Number
            +RoomType Type
            +RoomStatus Status
            +Occupy() void
            +MakeAvailable() void
        }
        class RoomType {
            <<enumeration>>
            STANDARD
            LUXURY
            SUITE
        }
        class RoomStatus {
            <<enumeration>>
            AVAILABLE
            RESERVED
            OCCUPIED
            DIRTY
            CLEANING
        }
        class IRoomRepository {
            <<interface>>
            +GetByNumberAsync(string roomNumber) Room
            +UpdateAsync(Room room) void
        }
        class CheckInHandler {
            +Handle(CheckInCommand cmd) CheckInResultDto
        }
        class CheckOutHandler {
            +Handle(CheckOutCommand cmd) CheckOutResultDto
        }
    }

    Reservation --> Guest : pertence a
    Reservation --> ReservationStatus : status
    Room --> RoomType : tipo
    Room --> RoomStatus : status

    CreateReservationHandler --> IReservationRepository : salva reserva
    CreateReservationHandler --> IGuestRepository : consulta hóspede
    CreateReservationHandler --> IHotelServiceClient : verifica quarto
    IHotelServiceClient --> IRoomRepository : consulta disponibilidade

    CheckInHandler --> IRoomRepository : ocupa quarto
    CheckOutHandler --> IRoomRepository : libera para limpeza
```

---

## 2. Destaques de Arquitetura de Classes

1. **Vertical Slice Architecture**: Cada funcionalidade possui seu próprio _Command_ ou _Query_, _Validator_, _Handler_ e _DTO_, eliminando acoplamentos horizontais entre casos de uso não correlacionados.
2. **Clean Architecture e Dependency Inversion**: Os _Handlers_ dependem unicamente de interfaces (`IReservationRepository`, `IRoomRepository`, `IEventPublisher`), enquanto as classes de persistência (`ReservationSqlRepository` e `RoomMongoRepository`) residem na camada de infraestrutura.
3. **Persistência Poliglota Especializada**:
   - `ReservationSqlRepository` e `GuestSqlRepository` utilizam **Azure SQL** para transações atômicas ACID, garantindo invariantes financeiras e evitando _overbooking_.
   - `RoomMongoRepository`, `CleaningTaskMongoRepository` e `StaffMongoRepository` utilizam **MongoDB Atlas** para estruturas flexíveis de documentos, histórico de auditoria e alta performance de consulta.
