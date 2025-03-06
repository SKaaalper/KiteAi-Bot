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
const sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const retry = async (fn, { maxAttempts, delay }) => {
  let attempt = 0;
  while (attempt <= maxAttempts) {
    try {
      const result = await fn();
      if (!result) {
        throw new Error("retry");
      }
      attempt = maxAttempts + 1;
      return result;
    } catch (error) {
      attempt++;
      if (attempt > maxAttempts) {
        return false;
      }
      await sleep(delay * 1000);
    }
  }
};

function loadWalletsFromFile() {
  try {
    return fs
      .readFileSync("wallets.txt", "utf-8")
      .split("\n")
      .filter((wallet) => wallet.trim())
      .map((wallet) => wallet.trim());
  } catch (error) {
    console.error(chalk.red("⚠️ Error: wallets.txt not found"));
    return [];
  }
}

function loadProxiesFromFile() {
  try {
    const proxyList = fs
      .readFileSync("proxies.txt", "utf-8")
      .split("\n")
      .filter((line) => line.trim())
      .map((proxy) => proxy.trim());
    proxyConfig.proxies = proxyList;
    console.log(
      chalk.green(
        `✅ Successfully loaded ${proxyList.length} proxies from file`
      )
    );
  } catch (error) {
    console.log(
      chalk.yellow(
        "⚠️ proxies.txt not found or empty. Using direct connection."
      )
    );
  }
}

function getNextProxy() {
  if (!proxyConfig.enabled || proxyConfig.proxies.length === 0) {
    return null;
  }
  const proxy = proxyConfig.proxies.shift();
  proxyConfig.proxies.push(proxy);
  return proxy;
}

const index = async () => {
  const askMode = () => {
    return new Promise((resolve) => {
      readline.question(
        chalk.yellow("🔄 Choose connection mode (1: Direct, 2: Proxy): "),
        resolve
      );
    });
  };
  const askWalletMode = () => {
    return new Promise((resolve) => {
      console.log(chalk.yellow("\n📋 Choose wallet mode:"));
      console.log(chalk.yellow("1. Manual input"));
      console.log(chalk.yellow("2. Load from wallets.txt"));
      readline.question(chalk.yellow("\nYour choice: "), resolve);
    });
  };

  const askWallet = () => {
    return new Promise((resolve) => {
      readline.question(chalk.yellow("🔑 Enter wallet address: "), resolve);
    });
  };

  const askLimit = () => {
    return new Promise((resolve) => {
      readline.question(
        chalk.yellow("Number of tasks executed simultaneously: "),
        resolve
      );
    });
  };

  try {
    const mode = await askMode();
    proxyConfig.enabled = mode === "2";
    if (proxyConfig.enabled) {
      loadProxiesFromFile();
    }
    const walletMode = await askWalletMode();
    let wallets = [];
    if (walletMode === "2") {
      wallets = loadWalletsFromFile();
      if (wallets.length === 0) {
        console.log(chalk.red("❌ No wallets loaded. Stopping program."));
        readline.close();
        return;
      }
    } else {
      const wallet = await askWallet();
      wallets = [wallet];
    }
    let limit = 1;
    if (wallets.length > 1) {
      const innerLimit = await askLimit();
      if (innerLimit) {
        limit = Number(innerLimit) || 1;
      }
    }
    limit = plimit(limit);

    const isRun = true;
    while (isRun) {
      const tasks = wallets.map(async (wallet) => {
        return limit(async () => {
          const proxy = proxyConfig.enabled ? getNextProxy() : null;
          const innerAxios = createAxiosInstance(proxy);
          await main({ wallet, innerAxios });
        });
      });
      await Promise.all(tasks);
    }
  } catch (e) {
    readline.close();
    console.error(chalk.red("⚠️ An error occurred:"), error);
  }
};

index();

