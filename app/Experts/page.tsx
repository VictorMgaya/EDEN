"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getRawXMLCache } from "@/utils/analyticsCache";
import ReactMarkdown from "react-markdown";

export default function ExpertsPage() {
  const [xmlData, setXmlData] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const rawXML = getRawXMLCache();
    setXmlData(rawXML || "");

    if (rawXML) {
      fetchGeminiInsights(rawXML);
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchGeminiInsights(data: string) {
    try {
      setLoading(true);
      const geminiApiKey = "AIzaSyAQUEzBOAmUqHtCqlfGMN43NtJs6w2KQn4";

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `
You are the Gemini AI Expert Advisor for Eden Resource Analysis Engine.
Analyze the following cached XML analytics data and produce a full professional report using this structure:

**Eden Resource Analysis Engine**
**Gemini AI Expert Advisor**
**CONFIDENTIAL // ANALYSIS REPORT**

**Analysis Timestamp:** [auto-generated current UTC time]
**Subject Location:** [from cached XML if available]
**Analysis Area:** [if available]

### **Executive Summary**
Provide a summary paragraph.

---

### **1. Resource Potential**
Analyze key resource potentials (agriculture, mining, energy, etc.) in bullet format.

### **2. Future Opportunities & Risks**
List major opportunities and potential risks clearly.

### **3. Development & Sustainability Advice**
Provide clear, actionable recommendations for sustainable development.

### **4. Recommendations by User Profile**
Give personalized advice for each of these profiles:
- Investor
- Developer
- Engineer
- Scientist
- Entrepreneur
- Farmer

End with a short summary note of confidence and realism.

---

Cached analytics data:
${data}
                    `,
                  },
                ],
              },
            ],
          }),
        }
      );

      const result = await response.json();
      const text =
        result?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No expert insights returned by Gemini.";
      setAiResponse(text);
    } catch (error) {
      console.error("Gemini fetch error:", error);
      setAiResponse("⚠️ Error retrieving expert analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "85vh",
        padding: "20px",
        background: "#f9fafb",
      }}
    >
      <h1
        style={{
          fontSize: "2rem",
          marginBottom: "20px",
          fontWeight: "bold",
          color: "#111827",
          textAlign: "center",
        }}
      >
        Gemini AI Expert Insights
      </h1>

      <div
        style={{
          width: "100%",
          maxWidth: "900px",
          background: "#fff",
          borderRadius: "10px",
          padding: "24px",
          boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
        }}
      >
        {loading ? (
          <p
            style={{
              color: "#555",
              fontStyle: "italic",
              textAlign: "center",
              margin: "40px 0",
            }}
          >
            🔍 Generating expert analysis... please wait a moment.
          </p>
        ) : xmlData ? (
          <div
            style={{
              background: "#f9fafb",
              padding: "20px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              lineHeight: "1.7",
              fontFamily: "Inter, sans-serif",
              color: "#1f2937",
            }}
          >
            <ReactMarkdown>{aiResponse}</ReactMarkdown>
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "20px",
            }}
          >
            <p
              style={{
                color: "#555",
                marginBottom: "20px",
                fontSize: "1.1rem",
              }}
            >
              ⚠️ No cached analytics data found.  
              Please collect location data first.
            </p>
            <Link href="/analytics">
              <button
                style={{
                  padding: "10px 20px",
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "1rem",
                  boxShadow: "0 3px 8px rgba(37,99,235,0.2)",
                }}
              >
                Go to Analytics Page
              </button>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
