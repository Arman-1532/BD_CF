const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');

const PORT = env.PORT;

app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});
