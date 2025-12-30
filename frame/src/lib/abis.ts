export const VAULT_ABI = [
    {
        inputs: [
            { internalType: "uint256", name: "dailyAmount", type: "uint256" }
        ],
        name: "subscribe",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [],
        name: "unsubscribe",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            { internalType: "address", name: "user", type: "address" }
        ],
        name: "subscriptions",
        outputs: [
            { internalType: "uint256", name: "dailyAmount", type: "uint256" },
            { internalType: "bool", name: "isActive", type: "bool" },
            { internalType: "uint256", name: "startDate", type: "uint256" },
            { internalType: "uint256", name: "lastDeduction", type: "uint256" }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            { internalType: "address", name: "user", type: "address" }
        ],
        name: "getUserTotalValue",
        outputs: [
            { internalType: "uint256", name: "", type: "uint256" }
        ],
        stateMutability: "view",
        type: "function"
    }
] as const;

export const ERC20_ABI = [
    {
        inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
        ],
        name: "approve",
        outputs: [
            { internalType: "bool", name: "", type: "bool" }
        ],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            { internalType: "address", name: "owner", type: "address" },
            { internalType: "address", name: "spender", type: "address" }
        ],
        name: "allowance",
        outputs: [
            { internalType: "uint256", name: "", type: "uint256" }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            { internalType: "address", name: "account", type: "address" }
        ],
        name: "balanceOf",
        outputs: [
            { internalType: "uint256", name: "", type: "uint256" }
        ],
        stateMutability: "view",
        type: "function"
    }
] as const;
