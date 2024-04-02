// Specify allowed origins
const corsOptions = {
    origin: 'file:///C:/Users/Hp/Desktop/github/identity-reconciliation/index.html',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

// Use cors with options
app.use(cors(corsOptions));