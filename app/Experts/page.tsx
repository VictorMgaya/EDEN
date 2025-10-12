/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { getRawXMLCache } from "@/utils/analyticsCache";
import DOMPurify from "dompurify";
import { Send } from "react-feather";

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
  
  <p>My analysis is data-driven and based on the geographic and environmental information from your location. Give me a moment to analyze your detailed data...</p>
  
  <p><em>Feel free to ask follow-up questions once the report is ready!</em></p>
</div>
`;

const createFollowUpSystemPrompt = () => `
You are Adam, the AI Expert Advisor made by Eden Resource Analysis Engine (RAE) and Trained by Google. You're having a conversation with a client about their resource analysis report.

CRITICAL OUTPUT FORMAT:
Respond ONLY with clean, valid HTML. No markdown, no code blocks, no backticks.

Use these HTML elements:
- <h3>Section Title</h3> for any section headers
- <p>Your response text</p> for paragraphs
- <ul><li>Item</li></ul> for lists
- <strong>text</strong> for emphasis
- <em>text</em> for subtle emphasis

MANDATORY IMAGE INTEGRATION:
You MUST include AT LEAST ONE relevant image in EVERY response using this exact format:
{{IMAGE:very specific descriptive keywords}}

IMPORTANT: Always include an image that visually illustrates your main point. Use 4-6 descriptive words that clearly describe the image. Be VERY SPECIFIC:

EXCELLENT EXAMPLES (use these as templates):
- {{IMAGE:red acidic ferralsol soil close up texture}}
- {{IMAGE:agricultural lime spreading on farm field}}
- {{IMAGE:healthy maize corn crops growing green field}}
- {{IMAGE:modern drip irrigation system vegetable farm rows}}
- {{IMAGE:large solar panel installation agricultural farm roof}}
- {{IMAGE:farmer testing soil pH levels agriculture}}
- {{IMAGE:tractor plowing fertile agricultural field equipment}}
- {{IMAGE:greenhouse hydroponic vegetable cultivation system}}
- {{IMAGE:water pump irrigation well rural farm}}

BAD EXAMPLES (too vague - NEVER use these):
- {{IMAGE:soil}}
- {{IMAGE:farm}}
- {{IMAGE:crops}}
- {{IMAGE:irrigation}}

RESPONSE STYLE:
- Be conversational and helpful
- Answer the specific question asked with specific information
- Provide actionable insights
- Keep responses focused and concise
- Reference previous analysis when relevant
- ALWAYS include at least ONE highly relevant image that illustrates your key point
- Use specific examples and concrete recommendations

EXAMPLE RESPONSE 1 (about soil):
<p>Great question about soil management! The Ferralsols in your area are highly weathered, acidic soils that are common in tropical regions. They're naturally low in nutrients and typically have a pH between 4.5-5.5, which is too acidic for most crops.</p>

{{IMAGE:red acidic ferralsol soil profile agriculture tropical}}

<h3>Why Liming is Essential</h3>
<ul>
<li><strong>Raises soil pH</strong> to the optimal 6.0-6.5 range for nutrient availability</li>
<li><strong>Reduces aluminum toxicity</strong> which can stunt root growth in acidic soils</li>
<li><strong>Improves nutrient uptake</strong> especially phosphorus, calcium, and magnesium</li>
<li><strong>Enhances microbial activity</strong> leading to better organic matter decomposition</li>
</ul>

<p>I recommend applying agricultural lime at a rate of 2-4 tons per hectare initially, then testing soil pH annually to maintain optimal levels. This investment will significantly improve your crop yields.</p>

EXAMPLE RESPONSE 2 (about crops):
<p>Excellent question! Based on the Ferralsol soil and tropical climate, here are the best crop options:</p>

<h3>Top Recommended Crops</h3>
<ul>
<li><strong>Cassava</strong> - highly tolerant of acidic soils and low fertility</li>
<li><strong>Sweet potatoes</strong> - grows well in poor soils with minimal inputs</li>
<li><strong>Pineapple</strong> - actually prefers slightly acidic conditions</li>
<li><strong>Tea or coffee</strong> - both thrive in acidic tropical soils</li>
</ul>

{{IMAGE:healthy cassava plants growing tropical farm field}}

<p>If you invest in proper liming and soil amendment, you can then successfully grow maize, beans, and vegetables. Start with the acid-tolerant crops while improving soil quality.</p>

CRITICAL RULES:
1. Output ONLY valid HTML
2. No markdown formatting whatsoever
3. MUST include {{IMAGE:...}} with VERY SPECIFIC keywords (4-6 descriptive words) in EVERY response
4. Images must be relevant to the main topic you're discussing
5. Be helpful, specific, and actionable
6. Keep responses professional but conversational

Remember: NO response should be without at least ONE image. Images make your advice more engaging and easier to understand!
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
    <main className="relative flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-950 font-[family-name:var(--font-lexend)] overflow-hidden">
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 overscroll-contain pb-[120px] pt-16 sm:pt-20">
        {!xmlData && !loading ? (
          renderNoDataMessage()
        ) : (
          <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 md:gap-4 ${
                  msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                }`}
                style={{
                  animation: "messageSlide 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                  animationFillMode: "both"
                }}
              >
                {msg.sender === "ai" && (
                  <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-xl border-2 bg-gradient-to-br from-blue-500 via-purple-600 to-teal-500 text-white" style={{ borderColor: 'rgba(59, 130, 246, 0.3)', boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.25), 0 8px 10px -6px rgba(59, 130, 246, 0.1)' }}>
                    <svg className="w-7 h-7 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                )}
                <div className={`flex-1 ${msg.sender === "user" ? "max-w-[85%]" : "max-w-[92%]"} min-w-0`}>
                  {msg.sender === "ai" && (
                    <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wider">
                      {index === 0 ? "🏭 Adam AI - Resource Analysis Expert" : "💡 Adam AI"}
                    </div>
                  )}
                  <div
                    className={`p-5 md:p-6 rounded-2xl shadow-lg border backdrop-blur-sm prose prose-sm max-w-none ${
                      msg.sender === "user"
                        ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white border-blue-400 shadow-blue-500/25"
                        : "bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 border-slate-200/50 dark:border-slate-700/50"
                    }`}
                    style={{
                      wordWrap: "break-word",
                      overflowWrap: "break-word",
                      lineHeight: "1.75",
                      boxShadow: msg.sender === "user"
                        ? "0 10px 40px -10px rgba(59, 130, 246, 0.4), 0 4px 25px -5px rgba(59, 130, 246, 0.1)"
                        : "0 4px 20px -4px rgba(0, 0, 0, 0.1), 0 2px 8px -2px rgba(0, 0, 0, 0.05)"
                    }}
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.text) }}
                  />
                </div>
                {msg.sender === "user" && (
                  <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-xl border-2 bg-gradient-to-br from-emerald-400 to-cyan-500 text-white" style={{ borderColor: 'rgba(16, 185, 129, 0.3)', boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.25), 0 8px 10px -6px rgba(16, 185, 129, 0.1)' }}>
                    <svg className="w-7 h-7 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 md:gap-4" style={{
                animation: "messageSlide 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                animationFillMode: "both"
              }}>
                <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-xl border-2 bg-gradient-to-br from-blue-500 via-purple-600 to-teal-500 text-white" style={{ borderColor: 'rgba(59, 130, 246, 0.3)', boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.25), 0 8px 10px -6px rgba(59, 130, 246, 0.1)' }}>
                  <svg className="w-7 h-7 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="flex-1 max-w-[92%]">
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wider">
                    💡 Adam AI
                  </div>
                  <div className="p-5 md:p-6 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/50 dark:border-slate-700/50 shadow-lg backdrop-blur-sm">
                    <div className="flex gap-2 mb-3">
                      <div className="flex gap-1">
                        <span className="w-3 h-3 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0s", animationDuration: "1.5s" }}></span>
                        <span className="w-3 h-3 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0.15s", animationDuration: "1.5s" }}></span>
                        <span className="w-3 h-3 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: "0.3s", animationDuration: "1.5s" }}></span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {messages.length <= 1
                        ? "🔍 Analyzing your comprehensive resource data and preparing expert recommendations..."
                        : "🤔 Processing your question and formulating detailed insights..."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 w-full border-t border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-t from-white/95 via-white/90 to-white/70 dark:from-slate-900/95 dark:via-slate-900/90 dark:to-slate-900/70 backdrop-blur-md p-4 md:p-6 shadow-[0_-8px_32px_0_rgba(0,0,0,0.12)] z-50 pb-safe">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
          <div className="flex gap-4 items-end">
            <div className="flex-1 relative">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={
                  !xmlData
                    ? "🌱 Please collect analytics data first to begin consultation..."
                    : "💬 Ask about soil analysis, crop recommendations, water management, or economic potential..."
                }
                className="w-full px-5 py-4 text-base border-2 border-slate-200 dark:border-slate-600 rounded-2xl bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed backdrop-blur-sm shadow-lg"
                disabled={loading || !xmlData}
              />
            </div>
            <button
              type="submit"
              className="w-16 h-14 md:w-18 md:h-16 flex-shrink-0 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-teal-500 hover:from-blue-600 hover:via-purple-700 hover:to-teal-600 text-white flex items-center justify-center text-2xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              style={{
                boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4), 0 8px 10px -6px rgba(59, 130, 246, 0.1)'
              }}
              disabled={loading || !xmlData || !userInput.trim()}
              title="Send message"
            >
              <Send className="w-6 h-6 md:w-7 md:h-7"/>
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes messageSlide {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        div::-webkit-scrollbar {
          width: 6px;
        }

        div::-webkit-scrollbar-track {
          background: transparent;
        }

        div::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 3px;
        }

        div::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
        }

        .prose h2 {
          margin-top: 1.5em;
          margin-bottom: 0.75em;
          font-size: 1.5em;
          font-weight: 700;
          color: hsl(var(--foreground));
        }

        .prose h3 {
          margin-top: 1.25em;
          margin-bottom: 0.5em;
          font-size: 1.25em;
          font-weight: 600;
          color: hsl(var(--foreground));
        }

        .prose p {
          margin-bottom: 1em;
          color: hsl(var(--foreground));
          line-height: 1.7;
        }

        .prose ul, .prose ol {
          margin-top: 0.75em;
          margin-bottom: 0.75em;
          padding-left: 1.5em;
        }

        .prose li {
          margin-bottom: 0.5em;
          color: hsl(var(--foreground));
        }

        .prose strong {
          color: hsl(var(--foreground));
          font-weight: 600;
        }

        @media (max-width: 640px) {
          .pb-safe {
            padding-bottom: calc(1rem + env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </main>
  );
}
