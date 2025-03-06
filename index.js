import _ from "lodash";
import plimit from "p-limit";
import { generate } from "random-words";
import chalk from "chalk";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { createInterface } from "readline";
import { SocksProxyAgent } from "socks-proxy-agent";
import { HttpsProxyAgent } from "https-proxy-agent";
import { HttpProxyAgent } from "http-proxy-agent";
import axios from "axios";
import fs from "fs";
import headers from "./headers.js";
import getRandomQuestion from "./questions.js";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const proxyConfig = {
  enabled: false,
  current: "direct",
  proxies: [],
};

const agents = [
  {
    url: "https://deployment-r89ftdnxa7jwwhyr97wq9lkg.stag-vxzy.zettablock.com/main",
    agent_id: "deployment_R89FtdnXa7jWWHyr97WQ9LKG",
  },
  {
    url: "https://deployment-fsegykivcls3m9nrpe9zguy9.stag-vxzy.zettablock.com/main",
    agent_id: "deployment_fseGykIvCLs3m9Nrpe9Zguy9",
  },
  {
    url: "https://deployment-xkerjnnbdtazr9e15x3y7fi8.stag-vxzy.zettablock.com/main",
    agent_id: "deployment_xkerJnNBdTaZr9E15X3Y7FI8",
  },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const retry = async (fn, { maxAttempts, delay }) => {
  let attempt = 0;
  while (attempt <= maxAttempts) {
    try {
      const result = await fn();
      if (!result) throw new Error("retry");
      return result;
    } catch (error) {
      attempt++;
      console.log(chalk.yellow(`🔄 Retry attempt ${attempt}/${maxAttempts}...`));
      if (attempt > maxAttempts) return false;
      await sleep(delay * 1000);
    }
  }
};

function loadWalletsFromFile() {
  try {
    return fs.readFileSync("wallets.txt", "utf-8")
      .split("\n")
      .map((wallet) => wallet.trim())
      .filter(Boolean);
  } catch (error) {
    console.error(chalk.red("⚠️ Error: wallets.txt not found"));
    return [];
  }
}

function createAxiosInstance(proxyUrl = null) {
  const config = {
    headers: { "Content-Type": "application/json" },
    timeout: 60000,
  };
  if (proxyUrl) {
    const proxyAgent = proxyUrl.startsWith("socks")
      ? new SocksProxyAgent(proxyUrl)
      : proxyUrl.startsWith("http")
      ? new HttpsProxyAgent(proxyUrl)
      : null;
    if (proxyAgent) {
      config.httpsAgent = proxyAgent;
    }
  }
  return axios.create(config);
}

const streamAxios = async ({ method, url, data, innerAxios }) => {
  let totalContent = "";
  try {
    console.log(chalk.blue("🔄 Sending request to:", url));
    const response = await innerAxios({ method, url, headers, data, responseType: "stream" });
    return new Promise((resolve, reject) => {
      response.data.on("data", (chunk) => {
        console.log("📝 Received chunk:", chunk.toString().substring(0, 100));
        try {
          const parsed = JSON.parse(chunk.toString().replace("data:", ""));
          const content = parsed?.choices?.[0]?.delta?.content || "";
          if (content) totalContent += content;
        } catch (error) {
          console.error("⚠️ Error parsing chunk:", error.message);
        }
      });
      response.data.on("end", () => resolve({ content: totalContent }));
      response.data.on("error", (error) => reject(error));
    });
  } catch (error) {
    console.error("❌ Request failed:", error.message);
    return { content: "" };
  }
};

const sendMessage = async ({ item, wallet_address, innerAxios }) => {
  try {
    const message = getRandomQuestion() || generate({ maxLength: 6 });
    console.log("💬 Message:", message);
    const { url, agent_id } = item;
    const { content } = await streamAxios({ method: "post", url, data: { message, stream: true }, innerAxios });
    if (!content) {
      console.log(chalk.red("⚠️ No content received, skipping..."));
      return false;
    }
    console.log("📨 Response received:", content);
  } catch (e) {
    console.error("❌ Error in sendMessage:", e);
  }
};

const main = async ({ wallet, innerAxios }) => {
  await Promise.all(agents.map(async (item) => sendMessage({ item, wallet_address: wallet, innerAxios })));
};

const index = async () => {
  try {
    const wallet = await new Promise((resolve) => readline.question(chalk.yellow("🔑 Enter wallet address: "), resolve));
    const innerAxios = createAxiosInstance();
    await main({ wallet, innerAxios });
  } catch (e) {
    console.error(chalk.red("⚠️ An error occurred:"), e);
  }
  readline.close();
};

index();
