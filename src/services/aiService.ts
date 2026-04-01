import { GoogleGenAI, Type } from "@google/genai";
import { dataService } from "./dataService";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const aiService = {
  async askQuestion(question: string, history: any[] = []) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is missing. AI Assistant may not work.");
    }
    const ai = new GoogleGenAI({ apiKey });
    
    const contents = [
      ...history,
      { role: "user", parts: [{ text: question }] }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        systemInstruction: `Вы — ведущий BI-аналитик системы "Green Mall". 
Ваша задача: отвечать на вопросы пользователя о продажах в США на РУССКОМ языке.

ПРАВИЛА:
1. Всегда используйте инструменты (tools) для получения данных.
2. После получения данных от инструмента, предоставьте подробный текстовый анализ на РУССКОМ языке:
   - Выведите ключевые цифры (выручка, количество продаж и т.д.).
   - Дайте интерпретацию результатов (тренды, лидеры, аномалии).
   - Если это прогноз, укажите ожидаемые значения на конец года.
   - Используйте форматирование валюты ($X,XXX.XX) и чисел (1,234).
3. Если вопрос не касается продаж, категорий, товаров, городов, продавцов или скидок, вежливо ответьте: "Не могу найти ответ на этот вопрос. Попробуйте спросить о продажах, категориях, товарах, городах, продавцах или скидках."
4. Если данных нет или произошла ошибка, ответьте: "Не удалось получить данные. Попробуйте переформулировать вопрос."

ТАБЛИЦА СООТВЕТСТВИЯ:
- "Продажи по месяцам", "Тренд", "Прогноз" -> getMonthlyRevenue()
- "Категории", "Прибыльность категорий" -> getRevenueByCategory()
- "Топ товаров", "Самый продаваемый" -> getTopProducts()
- "Города", "Где больше продаж" -> getTopCities()
- "Продавцы", "Лучший продавец" -> getTopSellers()
- "Скидки", "Влияние скидок" -> getDiscountAnalysis()
- "Пол продавца", "Разница между М и Ж" -> getGenderCategoryAnalysis()`,
        tools: [
          {
            functionDeclarations: [
              {
                name: "getDashboardKPIs",
                description: "Получить ключевые метрики (выручка, продажи, клиенты, средний чек). Можно фильтровать по городу, категории и датам.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    city_filter: { type: Type.STRING, description: "Название города для фильтрации" },
                    category_filter: { type: Type.STRING, description: "Название категории для фильтрации" },
                    start_date: { type: Type.STRING, description: "Начальная дата (ГГГГ-ММ-ДД)" },
                    end_date: { type: Type.STRING, description: "Конечная дата (ГГГГ-ММ-ДД)" }
                  }
                }
              },
              {
                name: "getMonthlyRevenue",
                description: "Получить выручку по месяцам и тренды. Можно фильтровать по городу, категории и датам.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    city_filter: { type: Type.STRING, description: "Название города для фильтрации" },
                    category_filter: { type: Type.STRING, description: "Название категории для фильтрации" },
                    start_date: { type: Type.STRING, description: "Начальная дата (ГГГГ-ММ-ДД)" },
                    end_date: { type: Type.STRING, description: "Конечная дата (ГГГГ-ММ-ДД)" }
                  }
                }
              },
              {
                name: "getRevenueByCategory",
                description: "Получить анализ выручки по категориям товаров. Можно фильтровать по городу и датам.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    city_filter: { type: Type.STRING, description: "Название города для фильтрации" },
                    start_date: { type: Type.STRING, description: "Начальная дата (ГГГГ-ММ-ДД)" },
                    end_date: { type: Type.STRING, description: "Конечная дата (ГГГГ-ММ-ДД)" }
                  }
                }
              },
              {
                name: "getTopProducts",
                description: "Получить рейтинг самых продаваемых товаров. Можно фильтровать по городу, категории и датам.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    lim: { type: Type.NUMBER, description: "Количество товаров (по умолчанию 10)" },
                    city_filter: { type: Type.STRING, description: "Название города для фильтрации" },
                    category_filter: { type: Type.STRING, description: "Название категории для фильтрации" },
                    start_date: { type: Type.STRING, description: "Начальная дата (ГГГГ-ММ-ДД)" },
                    end_date: { type: Type.STRING, description: "Конечная дата (ГГГГ-ММ-ДД)" }
                  }
                }
              },
              {
                name: "getTopCities",
                description: "Получить рейтинг городов по выручке. Можно фильтровать по категории и датам.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    lim: { type: Type.NUMBER, description: "Количество городов (по умолчанию 10)" },
                    category_filter: { type: Type.STRING, description: "Название категории для фильтрации" },
                    start_date: { type: Type.STRING, description: "Начальная дата (ГГГГ-ММ-ДД)" },
                    end_date: { type: Type.STRING, description: "Конечная дата (ГГГГ-ММ-ДД)" }
                  }
                }
              },
              {
                name: "getTopSellers",
                description: "Получить рейтинг лучших продавцов. Можно фильтровать по городу, категории и датам.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    lim: { type: Type.NUMBER, description: "Количество продавцов (по умолчанию 10)" },
                    city_filter: { type: Type.STRING, description: "Название города для фильтрации" },
                    category_filter: { type: Type.STRING, description: "Название категории для фильтрации" },
                    start_date: { type: Type.STRING, description: "Начальная дата (ГГГГ-ММ-ДД)" },
                    end_date: { type: Type.STRING, description: "Конечная дата (ГГГГ-ММ-ДД)" }
                  }
                }
              },
              {
                name: "getDiscountAnalysis",
                description: "Получить анализ влияния скидок на продажи. Можно фильтровать по городу, категории и датам.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    city_filter: { type: Type.STRING, description: "Название города для фильтрации" },
                    category_filter: { type: Type.STRING, description: "Название категории для фильтрации" },
                    start_date: { type: Type.STRING, description: "Начальная дата (ГГГГ-ММ-ДД)" },
                    end_date: { type: Type.STRING, description: "Конечная дата (ГГГГ-ММ-ДД)" }
                  }
                }
              },
              {
                name: "getGenderCategoryAnalysis",
                description: "Получить анализ связи пола продавца и категорий товаров. Можно фильтровать по городу и датам.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    city_filter: { type: Type.STRING, description: "Название города для фильтрации" },
                    start_date: { type: Type.STRING, description: "Начальная дата (ГГГГ-ММ-ДД)" },
                    end_date: { type: Type.STRING, description: "Конечная дата (ГГГГ-ММ-ДД)" }
                  }
                }
              }
            ]
          }
        ]
      }
    });

    return response;
  }
};
