// File: api/handler.js

export default function handler(req, res) {
  // Extract method and query parameters
  const { method, query } = req;

  switch (method) {
    case "GET":
      // Handle GET requests
      if (query.name) {
        res.status(200).json({ message: `Hello, ${query.name}!` });
      } else {
        res.status(200).json({ message: "Hello, world!" });
      }
      break;

    case "POST":
      // Handle POST requests (e.g., data submission)
      const { name, age } = req.body;
      if (name && age) {
        res.status(200).json({ message: `Received data for ${name}, age ${age}.` });
      } else {
        res.status(400).json({ error: "Please provide both name and age." });
      }
      break;

    default:
      // Handle unsupported methods
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).json({ error: `Method ${method} not allowed.` });
      break;
  }
}
