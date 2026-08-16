# Sistema Hoteleiro

### Integrantes

1. Alyson Ferreira de Souza
2. Flavia Cristina Fagundes
3. Lucas Aioria Serpa
4. Matheus Pereira Siqueira

---

# Context

```Mermaid
C4Context
    Person(hospede, "Hospede", "Realiza uma reserva e o pagamento.")
    System_Ext(Sistema_parceiro," Site externo de reservas de hotel",)
    System(Sistema_interno_hoteleiro, "Sistema interno hoteleiro", "")

    Rel(hospede, Sistema_parceiro, "Realiza Reserva")
    BiRel(Sistema_parceiro, Sistema_interno_hoteleiro, "Notifica e envia informações da hospedagem")

    UpdateLayoutConfig($c4ShapeInRow="1", $c4BoundaryInRow="1")
```

---

# Conteiner

```Mermaid
C4Container
    System_Ext(Sistema_parceiro," Site externo de reservas de hotel",)

    Container_Boundary(c1, "Sistema Interno Hoteleiro") {
        ContainerDb(api, "Aplicação API", "PHP, Laravel", "Irá receber os dados da reserva e aplicar a atualização das informações do hospede no banco de dados")
        ContainerDb(banco_de_dados, "Banco de dados", "SQL", "Armazena toda informação do hospede e da reserva.")
    }

    Rel(Sistema_parceiro, api, "Envia as informacoes da reserva")
    Rel(api, banco_de_dados, "Atualiza o banco de dados")
    UpdateLayoutConfig($c4ShapeInRow="1", $c4BoundaryInRow="1")

```

---

# Component

```Mermaid
C4Component
    ContainerDb(api, "Aplicação API", "PHP, Laravel", "Irá receber os dados da reserva e aplicar a atualização das informações do hospede no banco de dados")
    Container_Boundary(banco_de_dados, "Banco de dados SQL") {
        Component(query_handler, "query_handler", "SQL Internal Tool", "Gerencia as querys recebidas e <br> atualiza, deleta e adiciona as tabelas")
        Component(quarto, "Quarto", "Tabela SQL", "Armazena o numero do quarto, <br> sua sigla/tipo e seu status atual")
        Component(Hóspede, "Gerenciamento de Hóspedes", "Tabela SQL", "Cadastra e atualiza os dados dos hóspedes")
        Component(reserva, "Gerenciamento de reservass" "Tabela SQL", "Recebe e processa os dados da <BR> reserva, incluindo hóspede, <br> quarto, check-in e check-out.")
    }

    BiRel(api, query_handler, "Envia uma string query <br> para atualizar as tabelas <br> do banco de dados")
    Rel(query_handler, quarto, "Atualiza <br> tabela")
    Rel(query_handler, Hóspede, "Atualiza <br> tabela")
    Rel(query_handler, reserva, "Atualiza <br> tabela")
    UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="1")
```
