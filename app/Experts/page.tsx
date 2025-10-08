"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { getRawXMLCache } from "@/utils/analyticsCache";
import DOMPurify from "dompurify";

const GOOGLE_CSE_KEYS = [
  process.env.NEXT_PUBLIC_GOOGLE_CUSTOM_SEARCH_API_KEY,
  process.env.NEXT_PUBLIC_GOOGLE_CUSTOM_SEARCH_API_KEY1,
  process.env.NEXT_PUBLIC_GOOGLE_CUSTOM_SEARCH_API_KEY2,
];

const GOOGLE_CSE_ID = process.env.NEXT_PUBLIC_GOOGLE_CSE_ID;

// Helper function to validate image URLs
function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
}

// Fetch image URL using Google Custom Search API with fallback keys
async function fetchImageURL(query: string, fallbackImage: string = ""): Promise<string> {
  if (!GOOGLE_CSE_ID) {
    console.error('Google CSE ID is not defined');
    return fallbackImage;
  }

  // Clean and optimize the search query
  const searchQuery = query.trim().replace(/\s+/g, ' ');
  
  console.log(`🔍 Searching for image: "${searchQuery}"`);

  for (const apiKey of GOOGLE_CSE_KEYS) {
    if (!apiKey) continue;
    
    const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(searchQuery)}&cx=${GOOGLE_CSE_ID}&key=${apiKey}&searchType=image&num=5&imgSize=large&safe=active`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorDetails = await response.text();
        console.error(`Google CSE Error (Key: ${apiKey.slice(0, 8)}...): ${response.status} - ${errorDetails}`);
        continue;
      }
      
      const data = await response.json();
      const items = data.items || [];
      
      console.log(`✅ Found ${items.length} images for: "${searchQuery}"`);
      
      // Prioritize valid image extensions
      const validImages = items.filter((item: { link: string }) => isImageUrl(item.link));
      
      if (validImages.length > 0) {
        console.log(`🖼️ Using image: ${validImages[0].link}`);
        return validImages[0].link;
      }
      if (items.length > 0) {
        console.log(`🖼️ Using fallback image: ${items[0].link}`);
        return items[0].link;
      }
      
      console.warn(`⚠️ No images found for: "${searchQuery}"`);
      return fallbackImage;
    } catch (error) {
      console.error(`Error with API Key ${apiKey.slice(0, 8)}...:`, error);
    }
  }
  
  console.error('❌ All Google CSE API keys failed');
  return fallbackImage;
}

const createInitialPrompt = (data: string) => `
You are Adam, the AI Expert Advisor for Eden Resource Analysis Engine.

ROLE & EXPERTISE:
You are a senior resource analyst with expertise in geography, agriculture, environmental science, economics, and sustainable development. You provide actionable, data-driven insights based on rigorous analysis.

CRITICAL - READ THE DATA CAREFULLY:
Below is the FULL HTML PAGE containing all the analytics data. This HTML includes detailed information about the location including:
- Geographic coordinates and location details
- Elevation and terrain information
- Climate data (temperature, rainfall, humidity)
- Soil composition and quality
- Water resources and accessibility
- Agricultural suitability and crop recommendations
- Infrastructure and development potential
- Economic indicators and market access

CAREFULLY EXAMINE the entire HTML structure below. Look at ALL sections, data points, measurements, and recommendations. Extract specific numbers, percentages, and concrete data points.

ANALYTICS DATA (Full HTML Page):
${data}

ANALYSIS TASK:
Based on the COMPLETE HTML data above, provide a comprehensive, natural professional analysis. Reference SPECIFIC data points you find in the HTML (coordinates, elevation numbers, soil pH levels, rainfall amounts, temperature ranges, etc.).

CRITICAL OUTPUT FORMAT REQUIREMENTS:
You MUST respond ONLY with clean, valid HTML. No markdown, no code blocks, no formatting symbols.

Structure your response using these HTML elements ONLY:
- <h2>Main Section Title</h2> for major sections
- <h3>Subsection Title</h3> for subsections
- <p>Paragraph text here</p> for all regular text
- <ul><li>List item</li></ul> for unordered lists
- <ol><li>Numbered item</li></ol> for ordered lists
- <strong>bold text</strong> for emphasis
- <em>italic text</em> for subtle emphasis
- <br> for line breaks if needed

IMAGE INTEGRATION:
When you want to include a relevant image, use EXACTLY this format:
{{IMAGE:very specific descriptive keywords}}

Be EXTREMELY specific with image keywords. Use 4-6 descriptive words that clearly describe what the image should show:

GOOD EXAMPLES:
- {{IMAGE:lush green agricultural farmland with crops}}
- {{IMAGE:modern drip irrigation system in vegetable field}}
- {{IMAGE:solar panel array on agricultural land}}
- {{IMAGE:rural road infrastructure development construction}}
- {{IMAGE:farmer harvesting wheat grain crop}}

BAD EXAMPLES (too vague):
- {{IMAGE:farm}}
- {{IMAGE:water}}
- {{IMAGE:land}}

EXAMPLE OUTPUT STRUCTURE:
<h2>Location Analysis Overview</h2>
<p>This comprehensive analysis examines the resource potential at coordinates [SPECIFIC LAT/LONG from data]. Located at an elevation of [SPECIFIC NUMBER] meters, this site presents significant opportunities for sustainable development.</p>

{{IMAGE:aerial view fertile agricultural land with green fields}}

<h2>Climate and Environmental Conditions</h2>
<p>The location experiences [SPECIFIC climate type from data] with average annual temperatures of [SPECIFIC TEMP RANGE]. Rainfall patterns show [SPECIFIC rainfall data], distributed across [SPECIFIC NUMBER] months of the growing season.</p>

<h3>Key Climate Metrics</h3>
<ul>
<li><strong>Temperature Range:</strong> [SPECIFIC DATA] - optimal for [SPECIFIC crops]</li>
<li><strong>Annual Precipitation:</strong> [SPECIFIC MM] - [assessment based on data]</li>
<li><strong>Humidity Levels:</strong> [SPECIFIC %] - [implications from data]</li>
</ul>

{{IMAGE:weather station measuring rainfall temperature climate}}

<h2>Soil and Agricultural Potential</h2>
<p>Soil analysis reveals [SPECIFIC soil type and pH from data]. This composition indicates:</p>
<ul>
<li>Fertility level: [SPECIFIC rating from data]</li>
<li>Water retention capacity: [SPECIFIC info from data]</li>
<li>Suitability for: [SPECIFIC crops listed in data]</li>
</ul>

{{IMAGE:healthy dark soil agricultural field fertile}}

<h3>Recommended Crop Selection</h3>
<p>Based on the soil and climate data, the following crops demonstrate highest viability:</p>
<ol>
<li><strong>Priority crops:</strong> [SPECIFIC crops from data]</li>
<li><strong>Secondary options:</strong> [SPECIFIC crops from data]</li>
<li><strong>High-value alternatives:</strong> [SPECIFIC crops from data]</li>
</ol>

{{IMAGE:diverse crop harvest vegetables grains produce}}

<h2>Water Resources Assessment</h2>
<p>Water availability analysis shows [SPECIFIC data about water sources]. Key findings include:</p>
<ul>
<li>Groundwater depth: [SPECIFIC meters if available]</li>
<li>Surface water access: [SPECIFIC info from data]</li>
<li>Irrigation requirements: [SPECIFIC calculations from data]</li>
</ul>

{{IMAGE:water well irrigation agriculture rural area}}

<h2>Strategic Recommendations</h2>
<p>To optimize resource development at this location, stakeholders should prioritize:</p>
<ol>
<li><strong>Immediate actions:</strong> [SPECIFIC recommendations based on data]</li>
<li><strong>Short-term development:</strong> [SPECIFIC plans based on data]</li>
<li><strong>Long-term sustainability:</strong> [SPECIFIC strategies based on data]</li>
</ol>

<h3>Investment Priorities</h3>
<ul>
<li>[SPECIFIC infrastructure needs from data]</li>
<li>[SPECIFIC technology requirements from data]</li>
<li>[SPECIFIC resource management needs from data]</li>
</ul>

{{IMAGE:rural development infrastructure investment construction}}

<h2>Next Steps and Implementation</h2>
<p>Based on this comprehensive analysis, I recommend the following action plan:</p>
<ol>
<li>[SPECIFIC first step based on data]</li>
<li>[SPECIFIC second step based on data]</li>
<li>[SPECIFIC third step based on data]</li>
</ol>

WRITING GUIDELINES:
- CAREFULLY READ the entire HTML data and extract SPECIFIC information
- Reference ACTUAL numbers, measurements, and data points from the HTML
- Quote specific coordinates, elevations, temperatures, rainfall amounts, soil characteristics
- Be concrete and data-driven - use the actual information provided
- Include 4-6 relevant images throughout using {{IMAGE:...}} with VERY SPECIFIC descriptive keywords
- Write professionally but conversationally
- Start with location overview using actual coordinates and data
- Organize logically by resource type
- End with clear, actionable recommendations based on the data
- Use proper HTML structure - every section needs proper tags
- NO markdown syntax (no ##, **, -, etc.)
- NO code blocks or backticks
- Just clean, valid HTML

Remember: 
1. READ THE ENTIRE HTML DATA CAREFULLY before writing
2. Use SPECIFIC data points and numbers from the HTML
3. Output ONLY HTML
4. Make image keywords VERY SPECIFIC and descriptive (4-6 words minimum)
5. The HTML will be directly inserted into the page, so it must be valid and complete
`;

const WELCOME_MESSAGE = `
<div>
  <h2>👋 Hello! I'm Adam, your AI Expert Advisor</h2>
  
  <p>I'm analyzing the resource data you've collected and preparing a comprehensive professional report. This will include:</p>
  
  <ul>
    <li>🌍 <strong>Resource Potential Assessment</strong> - Agriculture, water, energy, and development suitability</li>
    <li>⚖️ <strong>Strategic Analysis</strong> - Key opportunities and risk factors</li>
    <li>💼 <strong>Stakeholder Recommendations</strong> - Tailored advice for investors, developers, entrepreneurs, and more</li>
    <li>🎯 <strong>Action Plan</strong> - Concrete next steps for implementation</li>
  </ul>
  
  <p>My analysis is data-driven and based on the geographic and environmental information from your location. Give me a moment to generate your detailed report...</p>
  
  <p><em>Feel free to ask follow-up questions once the report is ready!</em></p>
</div>
`;

const createFollowUpSystemPrompt = () => `
You are Adam, the AI Expert Advisor. You're having a conversation with a client about their resource analysis report.

CRITICAL OUTPUT FORMAT:
Respond ONLY with clean, valid HTML. No markdown, no code blocks, no backticks.

Use these HTML elements:
- <h3>Section Title</h3> for any section headers
- <p>Your response text</p> for paragraphs
- <ul><li>Item</li></ul> for lists
- <strong>text</strong> for emphasis
- <em>text</em> for subtle emphasis

IMAGE INTEGRATION:
If an image would help illustrate your response, include:
{{IMAGE:very specific descriptive keywords}}

Use 4-6 descriptive words that clearly describe the image. Be VERY SPECIFIC:

GOOD EXAMPLES:
- {{IMAGE:modern drip irrigation system vegetable farm field}}
- {{IMAGE:large solar panel installation on farm roof}}
- {{IMAGE:healthy dairy cattle grazing green pasture}}
- {{IMAGE:tractor plowing fertile agricultural field soil}}
- {{IMAGE:greenhouse vegetable cultivation hydroponic system}}

BAD EXAMPLES (too vague - don't use these):
- {{IMAGE:irrigation}}
- {{IMAGE:solar}}
- {{IMAGE:cows}}
- {{IMAGE:farm}}

RESPONSE STYLE:
- Be conversational and helpful
- Answer the specific question asked
- Provide actionable insights
- Keep responses focused and concise
- Reference previous analysis when relevant
- Include ONE relevant image if it genuinely adds value to your explanation
- Use specific examples and concrete recommendations

EXAMPLE RESPONSE:
<p>That's an excellent question about irrigation options. Based on the water availability data from your location, I'd recommend a combination approach that maximizes efficiency while minimizing costs:</p>

<h3>Optimal Irrigation Strategy</h3>
<ul>
<li><strong>Drip irrigation</strong> for high-value crops like vegetables and fruits - achieves 90-95% water efficiency and delivers water directly to plant roots</li>
<li><strong>Sprinkler systems</strong> for field crops like maize and wheat - provides good coverage and is more cost-effective for large areas</li>
<li><strong>Rainwater harvesting</strong> infrastructure to capture seasonal rainfall and supplement irrigation during dry periods</li>
</ul>

{{IMAGE:modern drip irrigation tubes in vegetable field rows}}

<p>Given your soil type and climate patterns, drip irrigation would provide the best return on investment for high-value vegetable cultivation, while sprinkler systems work well for grain crops. The initial investment is higher but you'll save 30-50% on water costs annually.</p>

<p>Would you like me to break down the cost analysis or discuss specific crop water requirements?</p>

Remember: 
1. Output ONLY valid HTML
2. No markdown formatting whatsoever
3. If using images, make keywords VERY SPECIFIC (4-6 descriptive words)
4. Be helpful and conversational
5. Provide actionable advice
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

  async function processImagesInText(text: string): Promise<string> {
    const imagePlaceholderRegex = /\{\{IMAGE:([^}]+)\}\}/g;
    const matches = Array.from(text.matchAll(imagePlaceholderRegex));
    
    let processedText = text;
    
    for (const match of matches) {
      const [fullMatch, keywords] = match;
      const imageUrl = await fetchImageURL(keywords.trim());
      
      if (imageUrl) {
        const imgTag = `<img src="${imageUrl}" alt="${keywords}" style="width:100%; max-width:700px; border-radius:12px; margin:20px auto; display:block; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />`;
        processedText = processedText.replace(fullMatch, imgTag);
      } else {
        processedText = processedText.replace(fullMatch, '');
      }
    }
    
    return processedText;
  }

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
      let text = await fetchGeminiAPI([{ parts: [{ text: prompt }] }]);
      
      if (text) {
        // Clean up any markdown artifacts that might slip through
        text = text.replace(/```html\n?/g, '').replace(/```\n?/g, '');
        text = text.trim();
        
        // Process image placeholders
        text = await processImagesInText(text);
        setMessages(prev => [...prev, { sender: "ai", text }]);
      } else {
        throw new Error("No expert insights returned by Gemini.");
      }
    } catch (err) {
      console.error("Gemini fetch error:", err);
      const errorMessage = "<p>⚠️ Error retrieving expert analysis. Please try again.</p>";
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
      // Build conversation history with system prompt
      const conversationHistory: GeminiContent[] = [
        { parts: [{ text: createFollowUpSystemPrompt() }] }
      ];
      
      // Add only the actual conversation (skip welcome message)
      currentMessages.slice(1).forEach((msg) => {
        conversationHistory.push({
          role: (msg.sender === "user" ? "user" : "model") as "user" | "model",
          parts: [{ text: msg.text }],
        });
      });

      let text = await fetchGeminiAPI(conversationHistory);
      
      if (text) {
        // Clean up any markdown artifacts
        text = text.replace(/```html\n?/g, '').replace(/```\n?/g, '');
        text = text.trim();
        
        // Process image placeholders
        text = await processImagesInText(text);
        setMessages((prev) => [...prev, { sender: "ai", text }]);
      } else {
        throw new Error("No response from Gemini for follow-up.");
      }
    } catch (err) {
      console.error("Gemini follow-up fetch error:", err);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "<p>⚠️ Error communicating with the expert. Please try again.</p>" },
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
                    className={`p-4 md:p-5 rounded-2xl shadow-md border prose prose-sm max-w-none ${
                      msg.sender === "user"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-card-foreground border-border"
                    }`}
                    style={{ 
                      wordWrap: "break-word", 
                      overflowWrap: "break-word", 
                      lineHeight: "1.7"
                    }}
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
          <div className="flex gap-3">
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

        .prose h2 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-size: 1.5em;
          font-weight: 700;
        }

        .prose h3 {
          margin-top: 1.25em;
          margin-bottom: 0.5em;
          font-size: 1.25em;
          font-weight: 600;
        }

        .prose p {
          margin-bottom: 1em;
        }

        .prose ul, .prose ol {
          margin-top: 0.75em;
          margin-bottom: 0.75em;
          padding-left: 1.5em;
        }

        .prose li {
          margin-bottom: 0.5em;
        }
      `}</style>
    </main>
  );
}