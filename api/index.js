require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API monbot-affiliation opérationnelle !');
});

app.use('/api/users', require('./routes/users'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/links', require('./routes/affiliateLinks'));
app.use('/api/clicks', require('./routes/clicks'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/referrals', require('./routes/referrals'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/diffusions', require('./routes/diffusions'));
app.use('/api/templates', require('./routes/messageTemplates'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Serveur API lancé sur le port ${PORT}`);
});