const functions = require('@google-cloud/functions-framework');
const axios = require('axios');

// El Webhook de Slack se configura como Variable de Entorno en GCP por seguridad
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

functions.http('enviarReportaje', async (req, res) => {
  // Habilitar CORS para que el formulario web de tu compañera pueda llamarlo
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Método no permitido');
  }

  try {
    const d = req.body;

    // Construcción estética del mensaje usando Slack Blocks
    const slackMessage = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "📸 ¡Nueva Petición de Reportaje Fotográfico!",
            emoji: true
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*👤 Agente:* ${d.agente || 'No indicado'}  |  *🔢 Ref:* ${d.referencia || 'S/R'}  |  *🏠 Operación:* ${d.operacion || 'No indicada'}\n*📍 Ubicación:* ${d.direccion || 'No indicada'} (${d.municipio || 'No indicado'})`
          }
        },
        {
          type: "divider"
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*🛠️ Servicios y Reportaje:*\n• *Servicios:* ${Array.isArray(d.servicios) ? d.servicios.join(', ') : (d.servicios || 'Ninguno')}\n• *Cartel:* ${d.cartel || 'No'}  |  *Tipología:* ${Array.isArray(d.tipologia) ? d.tipologia.join(', ') : (d.tipologia || 'No indicada')}`
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*🔑 Acceso y Contacto:*\n• *Método:* ${d.contacto || 'No indicado'}\n• *Datos:* ${d.datos_contacto || 'No indicados'}`
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*🧼 Estado de la Vivienda:*\n• *¿Concienciado de limpieza?:* ${d.limpia || 'No indicado'}\n• *Organiza Limpieza:* ${d.org_limpieza || 'No indicado'}  |  *Organiza Vaciado:* ${d.org_vaciado || 'No indicado'}\n• *¿Tiene luz?:* ${d.luz || 'No'}  |  *¿Fotos coinciden?:* ${d.fotos || 'No'}`
          }
        },
        {
          type: "divider"
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*🔗 Documentación y Enlaces:*\n• *¿Subido a Horus?:* ${d.horus || 'No'}\n• *📂 Enlace Precaptación:* ${d.enlace ? `<${d.enlace}|Hacer clic para ver fotos/vídeo>` : 'No aportado'}`
          }
        }
      ]
    };

    // Si hay observaciones, las añadimos al final de forma limpia
    if (d.observaciones && d.observaciones.trim() !== "") {
      slackMessage.blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*📝 Observaciones del Agente:*\n>${d.observaciones}`
        }
      });
    }

    // Enviar el payload a Slack
    await axios.post(SLACK_WEBHOOK_URL, slackMessage);

    return res.status(200).json({ status: 'success', message: 'Reportaje enviado a Slack correctamente' });

  } catch (error) {
    console.error('Error enviando a Slack:', error.message);
    return res.status(500).json({ status: 'error', message: 'Error interno en el servidor' });
  }
});