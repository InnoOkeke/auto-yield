export const VAULT_ABI = [
    {
        inputs: [],
        name: "withdraw",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ name: "newDailyAmount", type: "uint256" }],
        name: "updateDailyAmount",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "unsubscribe",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ name: "user", type: "address" }],
        name: "subscriptions",
        outputs: [
            { name: "dailyAmount", type: "uint256" },
            { name: "isActive", type: "bool" },
            { name: "startDate", type: "uint256" },
            { name: "lastDeduction", type: "uint256" }
        ],
        stateMutability: "view",
        type: "function",
    }
] as const;
