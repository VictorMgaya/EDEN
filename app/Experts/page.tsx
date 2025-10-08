"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { getRawXMLCache } from "@/utils/analyticsCache";
import DOMPurify from "dompurify";

const createInitialPrompt = (data: string) => `
You are Adam, the AI Expert Advisor for Eden Resource Analysis Engine.

ROLE & EXPERTISE:
You are a senior resource analyst with expertise in geography, agriculture, environmental science, economics, and sustainable development. You provide actionable, data-driven insights based on rigorous analysis.

ANALYSIS TASK:
Analyze the following XML analytics data and produce a comprehensive professional report with relevant visual imagery.

DATA:
${data}

OUTPUT FORMAT:
Deliver your response as clean HTML (no <html>, <head>, or <body> tags). Use semantic HTML5 elements.

IMAGE REQUIREMENTS - ABSOLUTELY CRITICAL:
For EACH major section, you MUST include a highly relevant image. Use actual image URLs from Unsplash:
- Format: <img src="https://source.unsplash.com/800x600/?[keywords]" style="width:100%; max-width:600px; border-radius:8px; margin:15px auto; display:block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" alt="descriptive alt text">
- Replace [keywords] with specific search terms (e.g., "agriculture,farming", "water,irrigation", "solar,energy", etc.)
- Use comma-separated keywords for better results
- EVERY section MUST have at least one relevant image
- Images should visually represent the content being discussed

EXAMPLE IMAGE USAGE:
<img src="https://source.unsplash.com/800x600/?sustainable,agriculture,farm" style="width:100%; max-width:600px; border-radius:8px; margin:15px auto; display:block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" alt="Sustainable Agriculture">

REPORT STRUCTURE:

<div style="padding: 20px;">

<h1 style="color: hsl(142.1 76.2% 36.3%); border-bottom: 3px solid hsl(142.1 76.2% 36.3%); padding-bottom: 10px; margin-bottom: 20px;">Eden Resource Analysis Report</h1>

<div style="background: hsl(240 4.8% 95.9%); padding: 15px; border-radius: 8px; margin-bottom: 30px;">
  <p style="margin: 5px 0;"><strong>Analyst:</strong> Adam AI Expert Advisor</p>
  <p style="margin: 5px 0;"><strong>Generated:</strong> ${new Date().toUTCString()}</p>
  <p style="margin: 5px 0;"><strong>Classification:</strong> Professional Analysis</p>
</div>

<h2 style="color: hsl(240 10% 3.9%); margin-top: 30px;">📋 Executive Summary</h2>
<img src="https://source.unsplash.com/800x600/?geography,landscape,satellite" style="width:100%; max-width:600px; border-radius:8px; margin:15px auto; display:block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" alt="Geographic Analysis">
<p>Provide a concise 3-4 sentence overview of the location's most significant characteristics, opportunities, and constraints. Be specific and actionable.</p>

<hr style="margin: 40px 0; border: none; border-top: 2px solid hsl(240 5.9% 90%);">

<h2 style="color: hsl(240 10% 3.9%); margin-top: 30px;">🌍 Resource Potential Assessment</h2>

<h3 style="color: hsl(240 5.9% 10%); margin-top: 25px;">🌾 Agricultural Viability</h3>
<img src="https://source.unsplash.com/800x600/?agriculture,farming,crops" style="width:100%; max-width:600px; border-radius:8px; margin:15px auto; display:block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" alt="Agricultural Potential">
<p>Assess soil quality, climate suitability, water availability, and crop potential. Be specific about crops and yields.</p>

<h3 style="color: hsl(240 5.9% 10%); margin-top: 25px;">💧 Water Resources</h3>
<img src="https://source.unsplash.com/800x600/?water,irrigation,reservoir" style="width:100%; max-width:600px; border-radius:8px; margin:15px auto; display:block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" alt="Water Resources">
<p>Evaluate groundwater, surface water, precipitation patterns, and irrigation potential.</p>

<h3 style="color: hsl(240 5.9% 10%); margin-top: 25px;">⚡ Energy Potential</h3>
<img src="https://source.unsplash.com/800x600/?solar,energy,renewable" style="width:100%; max-width:600px; border-radius:8px; margin:15px auto; display:block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" alt="Energy Potential">
<p>Analyze solar, wind, hydro, or biomass energy opportunities based on geographic data.</p>

<h3 style="color: hsl(240 5.9% 10%); margin-top: 25px;">🏗️ Development Suitability</h3>
<img src="https://source.unsplash.com/800x600/?construction,infrastructure,development" style="width:100%; max-width:600px; border-radius:8px; margin:15px auto; display:block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" alt="Development Infrastructure">
<p>Assess terrain, accessibility, infrastructure potential, and construction feasibility.</p>

<hr style="margin: 40px 0; border: none; border-top: 2px solid hsl(240 5.9% 90%);">

<h2 style="color: hsl(240 10% 3.9%); margin-top: 30px;">⚖️ Strategic Opportunities & Risk Factors</h2>
<img src="https://source.unsplash.com/800x600/?business,strategy,opportunity" style="width:100%; max-width:600px; border-radius:8px; margin:15px auto; display:block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" alt="Strategic Analysis">

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
  <div style="background: hsl(142.1 76.2% 96%); padding: 20px; border-radius: 8px; border-left: 4px solid hsl(142.1 76.2% 36.3%);">
    <h3 style="color: hsl(142.1 76.2% 36.3%); margin-top: 0;">✅ Key Opportunities</h3>
    <ul style="line-height: 1.8;">
      <li>List 3-5 concrete, actionable opportunities with specific details</li>
    </ul>
  </div>
  <div style="background: hsl(0 84.2% 97%); padding: 20px; border-radius: 8px; border-left: 4px solid hsl(0 84.2% 60.2%);">
    <h3 style="color: hsl(0 84.2% 60.2%); margin-top: 0;">⚠️ Critical Risks</h3>
    <ul style="line-height: 1.8;">
      <li>List 3-5 specific risks with mitigation strategies</li>
    </ul>
  </div>
</div>

<hr style="margin: 40px 0; border: none; border-top: 2px solid hsl(240 5.9% 90%);">

<h2 style="color: hsl(240 10% 3.9%); margin-top: 30px;">💼 Professional Recommendations by Stakeholder</h2>
<img src="https://source.unsplash.com/800x600/?business,meeting,consultation" style="width:100%; max-width:600px; border-radius:8px; margin:15px auto; display:block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" alt="Professional Consultation">

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0;">
  
  <div style="background: hsl(217 91.2% 95%); padding: 20px; border-radius: 8px; border-top: 3px solid hsl(217 91.2% 59.8%);">
    <h3 style="color: hsl(217 91.2% 59.8%); margin-top: 0;">📊 For Investors</h3>
    <p>ROI potential, risk assessment, capital requirements, expected timeline, and market conditions.</p>
  </div>

  <div style="background: hsl(48 96% 89%); padding: 20px; border-radius: 8px; border-top: 3px solid hsl(48 96% 53%);">
    <h3 style="color: hsl(28 96% 45%); margin-top: 0;">🏗️ For Developers</h3>
    <p>Site preparation needs, infrastructure requirements, regulatory considerations, and project phases.</p>
  </div>

  <div style="background: hsl(142.1 76.2% 95%); padding: 20px; border-radius: 8px; border-top: 3px solid hsl(142.1 76.2% 36.3%);">
    <h3 style="color: hsl(142.1 76.2% 36.3%); margin-top: 0;">🔬 For Scientists/Researchers</h3>
    <p>Research opportunities, data gaps, environmental monitoring needs, and collaboration potential.</p>
  </div>

  <div style="background: hsl(173 58% 89%); padding: 20px; border-radius: 8px; border-top: 3px solid hsl(173 58% 39%);">
    <h3 style="color: hsl(173 58% 29%); margin-top: 0;">🌱 For Agricultural Operators</h3>
    <p>Crop selection, farming practices, irrigation systems, market access, and yield optimization.</p>
  </div>

  <div style="background: hsl(280 65% 95%); padding: 20px; border-radius: 8px; border-top: 3px solid hsl(280 65% 60%);">
    <h3 style="color: hsl(280 65% 50%); margin-top: 0;">💼 For Entrepreneurs</h3>
    <p>Business opportunities, market gaps, value chain analysis, partnerships, and scalability.</p>
  </div>

  <div style="background: hsl(0 84.2% 95%); padding: 20px; border-radius: 8px; border-top: 3px solid hsl(0 84.2% 60.2%);">
    <h3 style="color: hsl(0 84.2% 50%); margin-top: 0;">⚙️ For Engineers</h3>
    <p>Technical challenges, design considerations, material requirements, and system integration.</p>
  </div>

</div>

<hr style="margin: 40px 0; border: none; border-top: 2px solid hsl(240 5.9% 90%);">

<h2 style="color: hsl(240 10% 3.9%); margin-top: 30px;">🎯 Recommended Next Steps</h2>
<ol style="line-height: 2; font-size: 1.05em;">
  <li><strong>On-site Verification:</strong> Conduct field surveys and soil testing</li>
  <li><strong>Stakeholder Engagement:</strong> Meet with local authorities and communities</li>
  <li><strong>Feasibility Studies:</strong> Commission detailed technical and financial analyses</li>
  <li><strong>Implementation Planning:</strong> Develop phased timeline with milestones</li>
  <li><strong>Risk Management:</strong> Establish monitoring and mitigation protocols</li>
</ol>

<div style="background: hsl(48 96% 89%); padding: 20px; border-radius: 8px; margin-top: 30px; border-left: 4px solid hsl(48 96% 53%);">
  <p style="margin: 0; font-style: italic; color: hsl(240 10% 3.9%);"><strong>⚠️ Disclaimer:</strong> This analysis is based on available geographic and environmental data. Ground-truthing and professional verification are essential before making investment or development decisions. Always consult with local experts and authorities.</p>
</div>

</div>

CRITICAL INSTRUCTIONS:
- Be highly specific and quantitative where possible
- Base ALL conclusions directly on the provided XML data
- Use professional, confident, and assertive language
- Avoid vague or generic statements
- Prioritize actionable, implementable insights
- MUST include Unsplash images in EVERY major section as shown above
- Customize image keywords to precisely match each section's content
- If data is insufficient for any section, explicitly state what additional data is needed
- Keep the HTML styling inline as shown for consistent rendering
- Use HSL color values from the design system provided
`;

const WELCOME_MESSAGE = `
<div style="padding: 20px; line-height: 1.6;">
  <h2 style="color: hsl(142.1 76.2% 36.3%); margin-bottom: 15px;">👋 Hello! I'm Adam, your AI Expert Advisor</h2>
  
  <p style="margin-bottom: 15px;">I'm analyzing the resource data you've collected and preparing a comprehensive professional report. This will include:</p>
  
  <ul style="margin-bottom: 15px; line-height: 1.8;">
    <li>🌍 <strong>Resource Potential Assessment</strong> - Agriculture, water, energy, and development suitability</li>
    <li>⚖️ <strong>Strategic Analysis</strong> - Key opportunities and risk factors</li>
    <li>💼 <strong>Stakeholder Recommendations</strong> - Tailored advice for investors, developers, entrepreneurs, and more</li>
    <li>🎯 <strong>Action Plan</strong> - Concrete next steps for implementation</li>
  </ul>
  
  <p style="margin-bottom: 10px;">My analysis is data-driven and based on the geographic and environmental information from your location. Give me a moment to generate your detailed report...</p>
  
  <p style="color: hsl(240 3.8% 46.1%); font-size: 0.9em; font-style: italic;">Feel free to ask follow-up questions once the report is ready!</p>
</div>
`;

interface GeminiContent {
  role?: "user" | "model";
  parts: { text: string }[];
}

export default function ExpertsPage() {
  const [xmlData, setXmlData] = useState("");
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rawXML = getRawXMLCache();
    setXmlData(rawXML || "");

    if (rawXML) {
      setMessages([{ sender: "ai", text: WELCOME_MESSAGE }]);
      setLoading(true);
      setTimeout(() => fetchInitialReport(rawXML), 1000);
    } else {
      setLoading(false);
      setError("No cached analytics data found. Please collect location data first.");
    }
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function fetchGeminiAPI(content: GeminiContent[]) {
    const geminiApiKey = "AIzaSyDxARPUj9xVbhOGGOOS9EXirSQET6w5C7I";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: content }),
      }
    );

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const result = await response.json();
    return result?.candidates?.[0]?.content?.parts?.[0]?.text;
  }

  async function fetchInitialReport(data: string) {
    setLoading(true);
    setError("");
    try {
      const prompt = createInitialPrompt(data);
      const text = await fetchGeminiAPI([{ parts: [{ text: prompt }] }]);
      if (text) {
        setMessages(prev => [...prev, { sender: "ai", text }]);
      } else {
        throw new Error("No expert insights returned by Gemini.");
      }
    } catch (err) {
      console.error("Gemini fetch error:", err);
      const errorMessage = "⚠️ Error retrieving expert analysis. Please try again.";
      setError(errorMessage);
      setMessages(prev => [...prev, { sender: "ai", text: errorMessage }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!userInput.trim() || loading) return;

    const newUserMessage = { sender: "user", text: userInput };
    const currentMessages = [...messages, newUserMessage];
    setMessages(currentMessages);
    setUserInput("");
    setLoading(true);

    try {
      const conversationHistory: GeminiContent[] = currentMessages.map((msg) => ({
        role: (msg.sender === "user" ? "user" : "model") as "user" | "model",
        parts: [{ text: msg.text }],
      }));

      const text = await fetchGeminiAPI(conversationHistory);
      if (text) {
        setMessages((prev) => [...prev, { sender: "ai", text }]);
      } else {
        throw new Error("No response from Gemini for follow-up.");
      }
    } catch (err) {
      console.error("Gemini follow-up fetch error:", err);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "⚠️ Error communicating with the expert. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const renderNoDataMessage = () => (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 max-w-md mx-auto bg-card rounded-xl shadow-lg border border-border">
      <div className="text-6xl mb-4">📊</div>
      <h2 className="text-2xl font-semibold mb-3 text-foreground">No Analytics Data Available</h2>
      <p className="text-muted-foreground mb-6 text-center leading-relaxed">{error}</p>
      <Link href="/analytics">
        <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
          Go to Analytics Page
        </button>
      </Link>
    </div>
  );

  return (
    <main className="flex flex-col h-svh bg-background font-[family-name:var(--font-lexend)] fixed inset-0 overflow-hidden">
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-8 overscroll-contain pb-24 md:pb-4">
        {!xmlData && !loading ? (
          renderNoDataMessage()
        ) : (
          <div className="max-w-5xl mx-auto flex flex-col gap-6 pb-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 md:gap-4 ${
                  msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                }`}
                style={{ animation: "messageSlide 0.4s ease-out" }}
              >
                {msg.sender === "ai" && (
                  <div className="flex-shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-xl md:text-2xl shadow-md">
                    🤖
                  </div>
                )}
                <div className={`flex-1 ${msg.sender === "user" ? "max-w-[85%]" : "max-w-[90%]"} min-w-0`}>
                  {msg.sender === "ai" && (
                    <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                      {index === 0 ? "Adam AI Expert Advisor" : "Adam AI"}
                    </div>
                  )}
                  <div
                    className={`p-4 md:p-5 rounded-2xl shadow-md border ${
                      msg.sender === "user"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-card-foreground border-border"
                    }`}
                    style={{ wordWrap: "break-word", overflowWrap: "break-word", lineHeight: "1.7" }}
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.text) }}
                  />
                </div>
                {msg.sender === "user" && (
                  <div className="flex-shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-destructive to-destructive/80 flex items-center justify-center text-xl md:text-2xl shadow-md">
                    👤
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 md:gap-4" style={{ animation: "messageSlide 0.4s ease-out" }}>
                <div className="flex-shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-xl md:text-2xl shadow-md">
                  🤖
                </div>
                <div className="flex-1 max-w-[90%]">
                  <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                    Adam AI
                  </div>
                  <div className="p-4 md:p-5 rounded-2xl bg-card border border-border shadow-md">
                    <div className="flex gap-1.5 mb-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0s", animationDuration: "1.4s" }}></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.2s", animationDuration: "1.4s" }}></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.4s", animationDuration: "1.4s" }}></span>
                    </div>
                    <p className="text-sm text-muted-foreground italic">
                      {messages.length <= 1
                        ? "Analyzing resource data and generating comprehensive report..."
                        : "Processing your question..."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-border bg-card/95 backdrop-blur-sm p-4 md:p-5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex-shrink-0 mb-[70px] md:mb-0">
        <form onSubmit={handleSendMessage} className="max-w-5xl mx-auto">
          <div className="flex gap-3 md:mb-0">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={
                !xmlData
                  ? "Please collect analytics data first..."
                  : "Ask a follow-up question about the analysis..."
              }
              className="flex-1 px-4 md:px-5 py-3 md:py-3.5 border-2 border-input rounded-full bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading || !xmlData}
            />
            <button
              type="submit"
              className="w-12 h-12 md:w-13 md:h-13 flex-shrink-0 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center text-xl font-bold shadow-md hover:shadow-lg hover:scale-105 active:scale-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              disabled={loading || !xmlData || !userInput.trim()}
              title="Send message"
            >
              ➤
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes messageSlide {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Custom scrollbar */
        div::-webkit-scrollbar {
          width: 8px;
        }

        div::-webkit-scrollbar-track {
          background: hsl(var(--background));
        }

        div::-webkit-scrollbar-thumb {
          background: hsl(var(--border));
          border-radius: 4px;
        }

        div::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground));
        }
      `}</style>
    </main>
  );
}
