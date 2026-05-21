// Prompt dataset for the app
const prompts = [
    {
        id: 1, title: "Cinematic Sunset Portrait",
        ai: "Midjourney", aiClass: "tag-mj",
        category: "Portrait",
        badge: "hot", badgeClass: "badge-hot",
        emoji: "🌅",
        thumbGrad: "linear-gradient(135deg,#ff6b35,#ff2233,#1a0010)",
        prompt: "Cinematic portrait of a young Indian man with curly hair, golden hour sunset behind him, mountains silhouette, volumetric god rays, shot on Sony A7III, 85mm f1.4, bokeh background, photorealistic, 8K, --ar 1:1 --v 6",
        rating: "4.9", downloads: "2.4K", author: "Ankit", free: true
    },
    {
        id: 2, title: "Neon Cyberpunk City Logo",
        ai: "Leonardo", aiClass: "tag-leo",
        category: "Logo",
        badge: "top", badgeClass: "badge-top",
        emoji: "🏙️",
        thumbGrad: "linear-gradient(135deg,#7c3aed,#4f46e5,#0f0a1e)",
        prompt: "Futuristic cyberpunk city logo design, neon red and gold color scheme, circuit board patterns, glitch effect, dark background, vector style, sharp edges, professional brand identity, 4K resolution",
        rating: "4.8", downloads: "1.8K", author: "AnkitStudioAI", free: true
    },
    {
        id: 3, title: "Anime Warrior Character",
        ai: "Stable Diffusion", aiClass: "tag-sd",
        category: "Anime",
        badge: "new", badgeClass: "badge-new",
        emoji: "⚔️",
        thumbGrad: "linear-gradient(135deg,#ec4899,#8b5cf6,#0f0a1e)",
        prompt: "Anime style warrior character, male, dark armor with golden accents, red glowing eyes, dramatic wind effect, cherry blossom petals falling, dynamic pose, masterpiece quality, ultra detailed, cinematic lighting",
        rating: "4.7", downloads: "3.1K", author: "Ankit", free: true
    },
    {
        id: 4, title: "YouTube Thumbnail Prompt",
        ai: "ChatGPT", aiClass: "tag-gpt",
        category: "Marketing",
        badge: "hot", badgeClass: "badge-hot",
        emoji: "📺",
        thumbGrad: "linear-gradient(135deg,#10a37f,#065f46,#011a12)",
        prompt: "Act as a YouTube thumbnail expert. Create a compelling title and visual description for a video about [TOPIC]. The thumbnail should have: bold contrasting colors, shocked/excited face expression, minimal text (max 3 words), high contrast background. Make it click-worthy and emotional.",
        rating: "5.0", downloads: "5.2K", author: "AnkitStudioAI", free: true
    },
    {
        id: 5, title: "Magical Fantasy Landscape",
        ai: "Midjourney", aiClass: "tag-mj",
        category: "Landscape",
        badge: "top", badgeClass: "badge-top",
        emoji: "🌌",
        thumbGrad: "linear-gradient(135deg,#0ea5e9,#0c4a6e,#030d1a)",
        prompt: "Epic fantasy landscape, floating islands with waterfalls, bioluminescent forest below, two moons in sky, aurora borealis, ancient stone ruins covered in glowing vines, dragon silhouette, ultra wide shot, cinematic, 8K, --ar 16:9 --v 6 --q 2",
        rating: "4.9", downloads: "1.6K", author: "Ankit", free: true
    },
    {
        id: 6, title: "Product Photography Pro",
        ai: "Gemini", aiClass: "tag-gem",
        category: "Photography",
        badge: "new", badgeClass: "badge-new",
        emoji: "📱",
        thumbGrad: "linear-gradient(135deg,#4285f4,#1a56db,#0a1628)",
        prompt: "You are a professional product photographer. Describe a perfect studio setup and lighting arrangement for photographing [PRODUCT]. Include: key light position, fill light ratio, background color, reflection board placement, camera settings (aperture, ISO, shutter speed), and post-processing tips for a luxury feel.",
        rating: "4.6", downloads: "980", author: "AnkitStudioAI", free: true
    },
    {
        id: 7, title: "Dragon Fire Anime Scene",
        ai: "Leonardo", aiClass: "tag-leo",
        category: "Fantasy",
        badge: "hot", badgeClass: "badge-hot",
        emoji: "🔥",
        thumbGrad: "linear-gradient(135deg,#ff4500,#dc2626,#1a0500)",
        prompt: "Anime dragon breathing blue fire, ancient temple background, dramatic rain, lightning strike, hero standing ground in foreground silhouette, epic scale, Studio Ghibli inspired, soft cel shading, highly detailed background, cinematic composition",
        rating: "4.8", downloads: "2.9K", author: "Ankit", free: true
    },
    {
        id: 8, title: "Viral Instagram Captions GPT",
        ai: "ChatGPT", aiClass: "tag-gpt",
        category: "Marketing",
        badge: "free", badgeClass: "badge-free",
        emoji: "✍️",
        thumbGrad: "linear-gradient(135deg,#10a37f,#0d9488,#011a12)",
        prompt: "You are an expert Indian social media content creator. Write 5 viral Instagram captions for a post about [TOPIC] in Hinglish (Hindi + English mix). Each caption must be: under 150 characters, include 1 relevant emoji, have a call-to-action, and feel authentic not corporate. Target audience: 18-28 year old Indians.",
        rating: "4.9", downloads: "4.1K", author: "AnkitStudioAI", free: true
    },
    {
        id: 9, title: "Mountain Trek Landscape",
        ai: "Midjourney", aiClass: "tag-mj",
        category: "Landscape",
        badge: "hot", badgeClass: "badge-hot",
        emoji: "⛰️",
        thumbGrad: "linear-gradient(135deg,#78350f,#b45309,#0a0500)",
        prompt: "Aerial drone shot of Indian Himalayas, golden hour light, tiny trekker silhouette on narrow ridge, dramatic cloud shadows, snow-capped peaks in distance, warm amber tones, ultra sharp details, National Geographic style, --ar 16:9 --v 6 --style raw",
        rating: "4.7", downloads: "1.3K", author: "Ankit", free: true
    },
    {
        id: 10, title: "Veo Cinematic Short Film",
        ai: "Stable Diffusion", aiClass: "tag-sd",
        category: "Video",
        badge: "new", badgeClass: "badge-new",
        emoji: "🎬",
        thumbGrad: "linear-gradient(135deg,#00bfff,#0066aa,#000d1a)",
        prompt: "Cinematic short film scene: A lone warrior walks through a burning village at night, slow motion ash falling like snow, dramatic orchestral score implied, handheld shaky cam feel, desaturated with warm fire highlights, IMAX quality, Christopher Nolan visual style, 24fps grain",
        rating: "4.5", downloads: "760", author: "AnkitStudioAI", free: true
    },
    {
        id: 11, title: "Futuristic Indian Bride",
        ai: "Midjourney", aiClass: "tag-mj",
        category: "Portrait",
        badge: "hot", badgeClass: "badge-hot",
        emoji: "👰",
        thumbGrad: "linear-gradient(135deg,#be185d,#7c3aed,#0f0514)",
        prompt: "Futuristic Indian bride, traditional lehenga with holographic patterns, neon bindi, cyberpunk Delhi skyline at night behind her, golden and magenta color palette, ultra detailed jewelry, flowing dupatta in wind, editorial fashion photography, Vogue India cover style, --ar 2:3 --v 6",
        rating: "5.0", downloads: "3.8K", author: "Ankit", free: true
    },
    {
        id: 12, title: "Brand Logo Generator GPT",
        ai: "ChatGPT", aiClass: "tag-gpt",
        category: "Logo",
        badge: "top", badgeClass: "badge-top",
        emoji: "💎",
        thumbGrad: "linear-gradient(135deg,#ffd700,#b45309,#0f0a00)",
        prompt: "Act as a world-class brand strategist and logo designer. For the brand '[BRAND NAME]' in the '[INDUSTRY]' industry targeting '[AUDIENCE]', provide: 1) Brand personality (3 adjectives), 2) Color palette with hex codes and psychology, 3) Font pairing recommendation, 4) Logo concept description (2 variations), 5) Tagline options (3). Make it memorable and timeless.",
        rating: "4.9", downloads: "6.1K", author: "AnkitStudioAI", free: true
    }
];