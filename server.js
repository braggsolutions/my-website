const express = require('express');
const app = express();
const port = 3000;

app.use(express.static(__dirname));
app.use(express.json());

// Simulated Grok API call function
function grokMathOperation(num1, num2, operation, apiKey) {
    const validApiKey = "xai-kBLhWmpnWsnQiBBxIMtK6JsdPmoMIvo2vNazmAeVuhCKjZ7QkTmuEbOjuWOj0geyYuiMUrnjR0iKjDKK";
    if (apiKey !== validApiKey) {
        throw new Error("Invalid API key");
    }

    const n1 = parseFloat(num1);
    const n2 = parseFloat(num2);
    
    if (isNaN(n1) || isNaN(n2)) {
        throw new Error("Invalid numbers");
    }

    let result;
    let message;
    switch(operation.toLowerCase()) {
        case "add":
            result = n1 + n2;
            message = `The result of adding ${num1} and ${num2} is ${result}`;
            break;
        case "multiply":
            result = n1 * n2;
            message = `The result of multiplying ${num1} and ${num2} is ${result}`;
            break;
        case "hypotenuse":
            result = Math.sqrt(n1 * n1 + n2 * n2);
            message = `For a right triangle with base ${num1} and height ${num2}, the hypotenuse is ${result.toFixed(2)}`;
            break;
        default:
            throw new Error("Unsupported operation");
    }

    return {
        messages: [
            { role: "system", content: "You are a math assistant." },
            { role: "user", content: `Perform ${operation} on ${num1} and ${num2}` },
            { role: "assistant", content: message }
        ],
        model: "grok-2-latest",
        stream: false,
        temperature: 0,
        result: result // Added for triangle drawing
    };
}

// API endpoint for math operations
app.post('/api/math', (req, res) => {
    const { num1, num2, operation, apiKey } = req.body;

    try {
        const response = grokMathOperation(num1, num2, operation, apiKey);
        res.json(response);
    } catch (error) {
        res.status(400).json({
            messages: [
                { role: "system", content: "You are a math assistant." },
                { role: "user", content: `Perform ${operation} on ${num1} and ${num2}` },
                { role: "assistant", content: `Error: ${error.message}` }
            ]
        });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});