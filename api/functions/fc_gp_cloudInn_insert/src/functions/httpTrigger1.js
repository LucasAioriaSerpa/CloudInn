const { app } = require('@azure/functions');
const { MongoClient, ServerApiVersion } = require('mongodb');

app.http('httpTrigger1', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        try {
            const mongoUri =uri = "mongodb+srv://mongodb:senha@cluster0.dn5gc.mongodb.net/?appName=Cluster0";
            if (!mongoUri) {
                return {
                    status: 500,
                    body: JSON.stringify({ error: 'A variável de ambiente MONGO_URI não foi configurada.' })
                };
            }

            const body = await request.json().catch(() => ({}));
            const pessoa = {
                nome: body.nome || 'Sem nome',
                idade: body.idade ?? null,
                email: body.email || null,
                criadoEm: new Date()
            };

            const client = new MongoClient(mongoUri, {
                serverApi: {
                    version: ServerApiVersion.v1,
                    strict: true,
                    deprecationErrors: true,
                }
            });

            await client.connect();
            const db = client.db(process.env.MONGO_DB_NAME || 'test');
            const result = await db.collection('pessoas').insertOne(pessoa);

            return {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mensagem: 'Pessoa cadastrada com sucesso!',
                    insertedId: result.insertedId,
                    pessoa
                })
            };
        } catch (error) {
            context.error('Erro ao inserir pessoa no MongoDB:', error);
            return {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: error.message })
            };
        }
    }
});
