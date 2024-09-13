import express from "express";
const app = express();
import http from "http";
import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import { data } from "./shwe.js";
dotenv.config();

const TELEGRAM_BOT_API_KEY = process.env.TELEGRAM_BOT_API_KEY;

//ENV
const PORT = process.env.PORT || 8000;
const server = http.createServer(app);

const telegramBot = new TelegramBot(TELEGRAM_BOT_API_KEY, { polling: true });

telegramBot.onText(/\/start/, (msg) => {
  telegramBot.sendMessage(msg.chat.id, `မင်္ဂလာပါ ${msg.chat.first_name} ${msg.chat.last_name ?? ""}\nပရဟိတနှင့် ကယ်ဆယ်ရေး အချက်အလက်များကို ရှာဖွေနိုင်ပါပြီ။ \nအသေးစိတ်ကြည့်ရန် /help ကို နှိပ်ပါ။`);
});

telegramBot.onText(/\/help/, async (msg) => {
  const dataArray = Object.keys(data).map((key) => [key]);
  telegramBot.sendMessage(msg.chat.id, "နိုင်ငံအလိုက် ရှာဖွေပါ", {
    reply_markup: {
      keyboard: dataArray,
    },
  });
});

telegramBot.on("message", (msg) => {
  const country = "မြန်မာ";
  if (msg.text.indexOf(country) === 0) {
    const dataArray = Object.keys(data.မြန်မာ).map((key) => [key]);
    telegramBot.sendMessage(msg.chat.id, "တိုင်းနှင့်ပြည်နယ် အလိုက် ရှာဖွေပါ", {
      reply_markup: {
        keyboard: dataArray,
      },
    });
  }

  let city = msg.text;
  if (city in data.မြန်မာ) {
    const dataArray = Object.keys(data.မြန်မာ[city]).map((key) => [key]);
    telegramBot.sendMessage(msg.chat.id, "မြို့ အလိုက် ရှာဖွေပါ", {
      reply_markup: {
        keyboard: dataArray,
      },
    });
  }

  if (city in data && city !== "မြန်မာ") {
    const dataMessage = Object.keys(data[city])
      .map((key) => Object.values(data[city][key]).join(" "))
      .join("\n\n");
    const rows = dataMessage.split("\n\n");
    const rowsPerPage = 10;
    const totalPages = Math.ceil(rows.length / rowsPerPage);
    let currentPage = 1;

    const paginationKeyboard = (current_page) => [
      [
        {
          text: "<<",
          callback_data: "prev_page",
        },
        {
          text: `Page ${currentPage} of ${totalPages}`,
          callback_data: current_page,
        },
        {
          text: ">>",
          callback_data: "next_page",
        },
      ],
    ];

    const sendMessage = (page) => {
      const startRow = (page - 1) * rowsPerPage;
      const endRow = startRow + rowsPerPage;
      const chunk = rows.slice(startRow, endRow).join("\n\n");
      telegramBot.sendMessage(msg.chat.id, chunk, {
        reply_markup: {
          inline_keyboard: paginationKeyboard(page),
        },
      });
    };

    sendMessage(1);

    telegramBot.on("callback_query", (callbackQuery) => {
      if (callbackQuery.data === "prev_page" && currentPage > 1) {
        currentPage--;
        sendMessage(currentPage);
      } else if (callbackQuery.data === "next_page" && currentPage < totalPages) {
        currentPage++;
        sendMessage(currentPage);
      }
    });
  }

  const findPathByKey = (obj, targetKey) => {
    const search = (obj, targetKey, path) => {
      for (let key in obj) {
        const newPath = [...path, key];

        if (key === targetKey) {
          return newPath;
        }

        if (typeof obj[key] === "object" && obj[key] !== null) {
          const result = search(obj[key], targetKey, newPath);
          if (result) return result;
        }
      }
      return null;
    };

    const path = search(obj, targetKey, []);

    return path ? path.slice(0, -1) : null;
  };

  const key = Object.keys(data).find((key) => Object.keys(data[key]).find((k) => Object.keys(data[key][k]).includes(city)));
  if (key) {
    const path = findPathByKey(data, city);
    const dataMessage = Object.keys(data[key][path[1]][city])
      .map((k) => Object.values(data[key][path[1]][city][k]).join(" "))
      .join("\n\n");
    const rows = dataMessage.split("\n\n");
    const rowsPerPage = 10;
    const totalPages = Math.ceil(rows.length / rowsPerPage);
    let currentPage = 1;

    const paginationKeyboard = (current_page) => [
      [
        {
          text: "<<",
          callback_data: "prev_page",
        },
        {
          text: `Page ${currentPage} of ${totalPages}`,
          callback_data: current_page,
        },
        {
          text: ">>",
          callback_data: "next_page",
        },
      ],
    ];

    const sendMessage = (page) => {
      const startRow = (page - 1) * rowsPerPage;
      const endRow = startRow + rowsPerPage;
      const chunk = rows.slice(startRow, endRow).join("\n\n");
      telegramBot.sendMessage(msg.chat.id, chunk, {
        reply_markup: {
          inline_keyboard: paginationKeyboard(page),
        },
      });
    };

    sendMessage(1);

    telegramBot.on("callback_query", (callbackQuery) => {
      if (callbackQuery.data === "prev_page" && currentPage > 1) {
        currentPage--;
        sendMessage(currentPage);
      } else if (callbackQuery.data === "next_page" && currentPage < totalPages) {
        currentPage++;
        sendMessage(currentPage);
      }
    });
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
