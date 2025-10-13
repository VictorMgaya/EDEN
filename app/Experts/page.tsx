/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DOMPurify from "dompurify";
import { Send, MessageCircle, User, Star, Zap, Cpu, ArrowLeft, Clock, CheckCircle, AlertCircle } from "react-feather";
import CreditModal from "@/components/CreditModal";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getRawXMLCache } from "@/utils/analyticsCache";

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
  const { status } = useSession();
  const router = useRouter();
  const [, setXmlData] = useState("");
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const [userSubscription, setUserSubscription] = useState('freemium');

  // Check credits on component mount and refresh after modal interactions
  useEffect(() => {
    const checkCredits = async () => {
      try {
        const response = await fetch('/api/users/credits/check');
        if (response.ok) {
          const data = await response.json();
          setUserCredits(data.credits);
          setUserSubscription(data.subscription || 'freemium');
        }
      } catch (error) {
        console.error('Error checking credits:', error);
      }
    };

    if (status === 'authenticated') {
      checkCredits();
    }
  }, [status]);

  // Refresh credits when modal closes (after potential purchase)
  useEffect(() => {
    if (!showCreditModal && status === 'authenticated') {
      const refreshCredits = async () => {
        try {
          const response = await fetch('/api/users/credits/check');
          if (response.ok) {
            const data = await response.json();
            setUserCredits(data.credits);
            setUserSubscription(data.subscription || 'freemium');
          }
        } catch (error) {
          console.error('Error refreshing credits:', error);
        }
      };

      // Small delay to allow webhook processing
      setTimeout(refreshCredits, 1000);
    }
  }, [showCreditModal, status]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check authentication
    if (status === 'loading') return;

    //if (status === 'unauthenticated') {
      //router.push('/');
      //return;
    //}

    // Check if user selected a specific session from dashboard
    const selectedSession = localStorage.getItem('selectedSession');
    if (selectedSession) {
      try {
        const sessionData = JSON.parse(selectedSession);
        if (sessionData && sessionData.locationData) {
          // Create mock XML data from session location for analysis
          const mockXML = createMockXMLFromSession(sessionData);
          setXmlData(mockXML);
          setMessages([{
            sender: "ai",
            text: `<div><h2>📍 Session Reference</h2><p>I'm analyzing your previous session from ${formatDate(sessionData.startTime)} at coordinates ${sessionData.locationData.lat.toFixed(4)}, ${sessionData.locationData.lng.toFixed(4)}.</p><p>What would you like to know about this analysis?</p></div>`
          }]);
          setLoading(false);
          localStorage.removeItem('selectedSession'); // Clear after use
          return;
        }
      } catch (error) {
        console.error('Error parsing selected session:', error);
      }
    }

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
  }, [status, router]);

  // Helper function to create mock XML from session data
  const createMockXMLFromSession = (session: { locationData: { lat: number; lng: number }; startTime: string }) => {
    const { lat, lng } = session.locationData;
    return `<div><h2>Location Analysis</h2><p>Coordinates: ${lat}, ${lng}</p><p>Analysis Date: ${session.startTime}</p></div>`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

    let creditData: {
      credits: number;
      subscription: string;
      charged?: number;
      isFirstCall?: boolean;
      error?: string;
    } | null = null;

    try {
      // Deduct credits for initial report
      const creditResponse = await fetch('/api/users/credits/deduct', {
        method: 'POST',
      });

      creditData = await creditResponse.json();

      if (!creditResponse.ok) {
        if (creditResponse.status === 402) {
          // Insufficient credits - show modal
          setShowCreditModal(true);
          setLoading(false);
          return;
        }
        throw new Error(creditData?.error || 'Credit deduction failed');
      }

      // Update credits
      if (creditData) {
        setUserCredits(creditData.credits);
      }

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

      // Try to refund credits on error (refund the amount that was charged)
      try {
        const refundAmount = creditData?.charged || 10;
        await fetch('/api/users/credits/refund', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: refundAmount })
        });
        setUserCredits(prev => prev + refundAmount);
      } catch (refundError) {
        console.error("Failed to refund credits:", refundError);
      }
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

      let creditData: {
        credits: number;
        subscription: string;
        charged?: number;
        isFirstCall?: boolean;
        error?: string;
      } | null = null;

      try {
        // Deduct credits first
        const creditResponse = await fetch('/api/users/credits/deduct', {
          method: 'POST',
        });

        creditData = await creditResponse.json();

        if (!creditResponse.ok) {
          if (creditResponse.status === 402) {
            // Insufficient credits - show modal with specific message
            setShowCreditModal(true);
            setMessages((prev) => prev.slice(0, -1)); // Remove the message
            setLoading(false);
            return;
          }
          throw new Error(creditData?.error || 'Credit deduction failed');
        }

        // Update credits
        if (creditData) {
          setUserCredits(creditData.credits);
        }

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

      // Try to refund credits on error (refund the amount that was charged)
      try {
        const refundAmount = creditData?.charged || 10;
        await fetch('/api/users/credits/refund', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: refundAmount })
        });
        setUserCredits(prev => prev + refundAmount);
      } catch (refundError) {
        console.error("Failed to refund credits:", refundError);
      }
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

  // New state for experts and chat management
  const [experts, setExperts] = useState({ ai: [], person: [] });
  const [selectedExpert, setSelectedExpert] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('experts');
  const [chatMode, setChatMode] = useState(false);

  // Fetch experts on component mount
  useEffect(() => {
    const fetchExperts = async () => {
      try {
        const response = await fetch('/api/experts');
        if (response.ok) {
          const data = await response.json();
          setExperts(data.experts);
        }
      } catch (error) {
        console.error('Error fetching experts:', error);
      }
    };

    if (status === 'authenticated') {
      fetchExperts();
    }
  }, [status]);

  // Fetch conversations when user changes
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch('/api/conversations');
        if (response.ok) {
          const data = await response.json();
          setConversations(data.conversations);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };

    if (status === 'authenticated') {
      fetchConversations();
    }
  }, [status]);

  const handleStartChat = async (expert: any) => {
    try {
      console.log('Starting chat with expert:', expert);

      // Check if user has enough credits
      if (userCredits < expert.expertPricePerMessage) {
        console.log('Insufficient credits');
        setShowCreditModal(true);
        return;
      }

      console.log('Creating conversation...');
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expertId: expert._id,
          expertType: expert.expertType,
          initialMessage: `Hello! I'd like to consult with you about my resource analysis. I have ${userCredits} credits available.`
        })
      });

      console.log('Conversation API response:', response);

      if (response.ok) {
        const data = await response.json();
        console.log('Conversation created:', data);
        setSelectedExpert(expert);

        // If this is an AI expert, start with a welcome message
        if (expert.expertType === 'ai') {
          setMessages([{
            sender: "ai",
            text: `<div><h3>🤖 ${expert.name} - AI Resource Analysis Expert</h3><p>Hello! I'm ${expert.name}, your AI resource analysis expert. I'm ready to help you understand your location data and provide comprehensive insights.</p><p>What would you like to know about your resource analysis? I can help with climate patterns, resource potential, development opportunities, and much more!</p></div>`
          }]);
        } else {
          // For human experts, show waiting message
          setMessages([{
            sender: "ai",
            text: `<div><h3>👨‍💼 ${expert.name} - Human Expert</h3><p>Connecting you with ${expert.name}...</p><p>Please wait while we establish the connection. ${expert.name} will be with you shortly.</p></div>`
          }]);
        }

        setChatMode(true);
      } else {
        const errorData = await response.json();
        console.error('Error creating conversation:', errorData);
        alert('Error starting conversation: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Error starting conversation. Please try again.');
    }
  };

  const renderExpertSelection = () => (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
          🌟 Expert Consultation Hub
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 mb-6">
          Choose from our AI and Human experts for personalized resource analysis insights
        </p>

        {/* Credits Display */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 rounded-full border border-emerald-200 dark:border-emerald-800">
          <Zap className="w-5 h-5 text-emerald-600" />
          <span className="font-semibold text-emerald-800 dark:text-emerald-200">
            {userCredits} Credits Available
          </span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 h-14 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20">
          <TabsTrigger value="experts" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            <MessageCircle className="h-4 w-4" />
            Choose Expert
          </TabsTrigger>
          <TabsTrigger value="conversations" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            <MessageCircle className="h-4 w-4" />
            My Conversations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="experts" className="space-y-8">
          {/* AI Experts Section */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Cpu className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">🤖 AI Experts</h2>
                <p className="text-slate-600 dark:text-slate-400">Instant analysis with advanced algorithms</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {experts.ai.map((expert: any) => (
                <Card key={expert._id} className="group relative overflow-hidden bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <CardHeader className="relative pb-2">
                    <div className="flex items-center justify-between">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={expert.image} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg">
                          {expert.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                        AI Expert
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="mb-4">
                      <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-1">{expert.name}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{expert.expertTitle}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-500">{expert.expertSpecialty}</p>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < Math.floor(expert.expertRating || 0) ? 'text-yellow-400 fill-current' : 'text-slate-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {expert.expertRating?.toFixed(1) || '0.0'}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">{expert.expertPricePerMessage} credits</div>
                        <div className="text-xs text-slate-500">per message</div>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleStartChat(expert)}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      disabled={userCredits < expert.expertPricePerMessage}
                    >
                      Start Consultation
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Person Experts Section */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">👨‍🌾 Human Experts</h2>
                <p className="text-slate-600 dark:text-slate-400">Real-time consultation with resource analysis specialists</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {experts.person.map((expert: any) => (
                <Card key={expert._id} className="group relative overflow-hidden bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <CardHeader className="relative pb-2">
                    <div className="flex items-center justify-between">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={expert.image} />
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white text-lg">
                          {expert.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300">
                          Human Expert
                        </Badge>
                        {expert.expertAvailability && (
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="mb-4">
                      <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-1">{expert.name}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{expert.expertTitle}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-500">{expert.expertSpecialty}</p>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < Math.floor(expert.expertRating || 0) ? 'text-yellow-400 fill-current' : 'text-slate-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {expert.expertRating?.toFixed(1) || '0.0'}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">{expert.expertPricePerMessage} credits</div>
                        <div className="text-xs text-slate-500">per message</div>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleStartChat(expert)}
                      className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                      disabled={userCredits < expert.expertPricePerMessage || !expert.expertAvailability}
                    >
                      {expert.expertAvailability ? 'Start Chat' : 'Currently Offline'}
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {/* Add placeholder for the main expert */}
              <Card className="group relative overflow-hidden bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-dashed border-2">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-400 to-slate-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-600 dark:text-slate-400 mb-2">More Experts Coming Soon</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-500">We're continuously adding resource analysis specialists</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="conversations" className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">💬 My Conversations</h2>
            <p className="text-slate-600 dark:text-slate-400">Continue your consultations with experts</p>
          </div>

          {conversations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {conversations.map((conversation: any) => (
                <Card key={conversation._id} className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={conversation.expertId?.image} />
                        <AvatarFallback className={`${conversation.expertType === 'ai' ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gradient-to-br from-emerald-500 to-green-600'} text-white`}>
                          {conversation.expertId?.name?.charAt(0) || 'E'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                          {conversation.expertId?.name || 'Expert'}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {conversation.expertType === 'ai' ? 'AI Expert' : 'Human Expert'}
                        </p>
                      </div>
                      <Badge variant={conversation.expertType === 'ai' ? 'default' : 'secondary'}>
                        {conversation.expertType === 'ai' ? '🤖 AI' : '👨‍🌾 Human'}
                      </Badge>
                    </div>

                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      Last message: {new Date(conversation.lastMessageAt).toLocaleDateString()}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-500">
                        {conversation.messages?.length || 0} messages
                      </div>
                      <Button size="sm" variant="outline">
                        Continue Chat
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageCircle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                No Conversations Yet
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Start your first expert consultation to see your conversation history here.
              </p>
              <Button onClick={() => setActiveTab('experts')}>
                Browse Experts
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderChatInterface = () => (
    <div className="max-w-4xl mx-auto p-6">
      {/* Chat Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" onClick={() => setChatMode(false)}>
            ← Back to Experts
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={selectedExpert?.image} />
              <AvatarFallback className={`${selectedExpert?.expertType === 'ai' ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gradient-to-br from-emerald-500 to-green-600'} text-white`}>
                {selectedExpert?.name?.charAt(0) || 'E'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                {selectedExpert?.name}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {selectedExpert?.expertTitle} • {selectedExpert?.expertPricePerMessage} credits/message
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div ref={chatContainerRef} className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl border border-white/20 h-96 overflow-y-auto p-6 mb-6">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              Start Your Consultation
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Ask questions about your resource analysis and get expert insights.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex gap-3 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <Avatar className="w-8 h-8 flex-shrink-0">
                  {msg.sender === "user" ? (
                    <>
                      <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-cyan-500 text-white text-sm">
                        You
                      </AvatarFallback>
                    </>
                  ) : (
                    <>
                      <AvatarImage src={selectedExpert?.image} />
                      <AvatarFallback className={`${selectedExpert?.expertType === 'ai' ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gradient-to-br from-emerald-500 to-green-600'} text-white text-sm`}>
                        {selectedExpert?.name?.charAt(0) || 'E'}
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
                <div className={`flex-1 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                  <div
                    className={`inline-block max-w-[80%] p-3 rounded-2xl ${
                      msg.sender === "user"
                        ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                    }`}
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.text) }}
                  />
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={selectedExpert?.image} />
                  <AvatarFallback className={`${selectedExpert?.expertType === 'ai' ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gradient-to-br from-emerald-500 to-green-600'} text-white`}>
                    {selectedExpert?.name?.charAt(0) || 'E'}
                  </AvatarFallback>
                </Avatar>
                <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSendMessage} className="flex gap-4">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Ask your question..."
          className="flex-1 px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-2xl bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={loading}
        />
        <Button
          type="submit"
          className="px-6 py-3 bg-gradient-to-br from-blue-500 via-purple-600 to-teal-500 hover:from-blue-600 hover:via-purple-700 hover:to-teal-600 text-white rounded-2xl"
          disabled={loading || !userInput.trim()}
        >
          <Send className="w-5 h-5" />
        </Button>
      </form>
    </div>
  );

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-950 font-[family-name:var(--font-lexend)] overflow-hidden">
      {!chatMode ? renderExpertSelection() : renderChatInterface()}

      <CreditModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        credits={userCredits}
        subscription={userSubscription}
      />
    </main>
  );
}
