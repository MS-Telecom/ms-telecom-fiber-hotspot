const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();

app.use(bodyParser.json());

const PIX_API_URL = "https://api.seubanco.com.br/endpoint";
const usuario = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
const senha = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
const chavePix = "8723cf7b-bbfa-4495-8068-d652610c94bc";
const urlNotificacao = "https://algumacoisa.com";
const MIKROTIK_API_URL = "http://mikrotik-ip-address/api"; // URL da API do Mikrotik

app.post('/generate-pix', async (req, res) => {
    const { amount } = req.body;

    const dadosPagamento = {
        usuario: usuario,
        senha: senha,
        chave_pix: chavePix,
        url_notificacao: urlNotificacao,
        tipo_pagamento: "pix",
        valor: amount
    };

    try {
        const response = await axios.post(PIX_API_URL, dadosPagamento, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.data) {
            const { qr_code, pix_code, txid } = response.data;
            res.json({ qr_code, pix_code, txid });
        } else {
            res.status(500).json({ error: 'Erro ao gerar pagamento' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/check-payment', async (req, res) => {
    const { txid } = req.query;

    try {
        const response = await axios.get(`${PIX_API_URL}/check/${txid}`, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.access_granted) {
            const hours = response.data.hours;
            res.redirect(`/liberado.html?hours=${hours}`);
        } else {
            res.json({ access_granted: false });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/grant-access', async (req, res) => {
    const { mac, hours } = req.body;

    try {
        const response = await axios.post(MIKROTIK_API_URL, {
            mac: mac,
            limitUptime: `${hours}:00:00`
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 200) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: 'Erro ao liberar acesso no Mikrotik' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
