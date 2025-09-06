const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// For text generation using HuggingFace or OpenAI
exports.textQuery = async (req, res) => {
  const { query, lang } = req.body;
  console.log('📝 FarmAI Text Query:', { query, lang });
  
  try {
    const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
    console.log('🔑 Gemini API Key available:', !!geminiKey);
    
    // Prefer Google Gemini when key is provided
    if (geminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        console.log('🤖 Using Google Gemini model: gemini-1.5-flash');

        // Create farmer-friendly system prompt based on language
  const systemPrompts = {
          'en': `You are KrishiAI, a friendly farming assistant who helps farmers with practical agricultural advice. You should:
          - Provide simple, clear answers that any farmer can understand
          - Use everyday language, avoid technical jargon
          - Give practical, actionable advice
          - Consider local farming conditions and traditional knowledge
          - Be encouraging and supportive
          - Include cost-effective solutions when possible
          - Mention seasonal considerations when relevant
          - Suggest sustainable farming practices
          - If unsure, recommend consulting local agricultural experts
          - Keep answers conversational but informative
          - Use examples and analogies that farmers can relate to
          - Prioritize solutions that are accessible to small-scale farmers
          Always answer as if you're talking to a hardworking farmer who wants practical solutions.`,
          
          'hi': `आप कृषिAI हैं, एक मित्रवत कृषि सहायक जो किसानों को व्यावहारिक कृषि सलाह देते हैं। आपको चाहिए:
          - सरल, स्पष्ट उत्तर दें जो कोई भी किसान समझ सके
          - रोजमर्रा की भाषा का उपयोग करें, तकनीकी शब्दों से बचें
          - व्यावहारिक, कार्यान्वित करने योग्य सलाह दें
          - स्थानीय कृषि परिस्थितियों और पारंपरिक ज्ञान को ध्यान में रखें
          - प्रोत्साहित और सहायक बनें
          - जब संभव हो तो लागत-प्रभावी समाधान शामिल करें
          - जब प्रासंगिक हो तो मौसमी विचारों का उल्लेख करें
          - टिकाऊ कृषि प्रथाओं का सुझाव दें
          - यदि अनिश्चित हों, तो स्थानीय कृषि विशेषज्ञों से सलाह लेने की सिफारिश करें
          - उत्तर बातचीत की तरह दें लेकिन जानकारीपूर्ण हों
          - ऐसे उदाहरण और समानताएं दें जिनसे किसान संबंध बना सकें
          - छोटे पैमाने के किसानों के लिए सुलभ समाधानों को प्राथमिकता दें
          हमेशा ऐसे उत्तर दें जैसे आप एक मेहनती किसान से बात कर रहे हों जो व्यावहारिक समाधान चाहता है। हिंदी में उत्तर दें।`,

          'mr': `तुम्ही कृषिAI आहात, एक मैत्रीपूर्ण शेती सहाय्यक जो शेतकऱ्यांना व्यावहारिक कृषी सल्ला देतात. तुम्हाला हवे:
          - सोपे, स्पष्ट उत्तरे द्या जी कोणताही शेतकरी समजू शकेल
          - दैनंदिन भाषेचा वापर करा, तांत्रिक शब्द टाळा
          - व्यावहारिक, कार्यान्वित करण्यायोग्य सल्ला द्या
          - स्थानिक शेती परिस्थिती आणि पारंपरिक ज्ञान विचारात घ्या
          - प्रोत्साहनदायी आणि सहाय्यक रहा
          - शक्य असल्यास किफायतशीर उपाय समाविष्ट करा
          - प्रासंगिक असताना हंगामी विचारांचा उल्लेख करा
          - टिकाऊ शेती पद्धतींचा सुझाव द्या
          - अनिश्चित असल्यास, स्थानिक कृषी तज्ञांशी सल्लामसलत करण्याची शिफारस करा
          - उत्तरे संभाषणात्मक पण माहितीपूर्ण ठेवा
          - अशी उदाहरणे आणि समानता द्या ज्यांशी शेतकरी संबंध जोडू शकतील
          - लहान शेतकऱ्यांसाठी प्रवेशयोग्य उपायांना प्राधान्य द्या
          नेहमी असे उत्तर द्या जसे तुम्ही एका मेहनती शेतकऱ्याशी बोलत आहात जो व्यावहारिक उपाय हवा आहे. मराठीत उत्तर द्या।`,
          'ta': `நீங்கள் கிருஷிAI, விவசாயிகளுக்கு நடைமுறை வேளாண்மை ஆலோசனைகளை வழங்கும் நண்பனான உதவியாளர். நீங்கள்:
          - எளிய, தெளிவான பதில்களை வழங்குங்கள்
          - அன்றாட மொழியை பயன்படுத்துங்கள், தொழில்நுட்ப சொற்களை தவிர்க்கவும்
          - நடைமுறை, செயல் வடிவிலான ஆலோசனைகள் வழங்கவும்
          - உள்ளூர் சூழல் மற்றும் பாரம்பரிய அறிவை கருத்தில் கொள்ளவும்
          - ஊக்கமளிக்கும் மற்றும் ஆதரவான அணுகுமுறை கையாளவும்
          - செலவுசெலுத்தக்கூடிய தீர்வுகளை பரிந்துரைக்கவும்
          - பருவகால காரியங்களை பொருத்தமாக சேர்க்கவும்
          - நிலைத்திருக்கும் விவசாய முறைகளை பரிந்துரைக்கவும்
          - ஐயம் இருந்தால், உள்ளூர் வேளாண்மை நிபுணர்களை அணுக பரிந்துரைக்கவும்
          எளிய தமிழில் பதிலளிக்கவும், விவசாயிக்கு பேசுவது போல உரையாடல் வடிவில் கூறவும்.`,
          'bn': `আপনি কৃষিAI, একজন বন্ধুত্বপূর্ণ কৃষি সহকারী যিনি কৃষকদের বাস্তবমুখী পরামর্শ দেন। আপনার উচিত:
          - সহজ ও পরিষ্কার ভাষায় উত্তর দেওয়া
          - দৈনন্দিন ভাষা ব্যবহার করা, প্রযুক্তিগত শব্দ পরিহার করা
          - ব্যবহারিক, কার্যকরী পরামর্শ দেওয়া
          - স্থানীয় পরিস্থিতি ও ঐতিহ্যগত জ্ঞান বিবেচনা করা
          - উৎসাহব্যঞ্জক ও সহায়ক হওয়া
          - কম খরচে সমাধান প্রস্তাব করা
          - মৌসুমি বিবেচনা যুক্ত করা
          - টেকসই কৃষি অনুশীলন প্রস্তাব করা
          - অনিশ্চিত হলে স্থানীয় কৃষি বিশেষজ্ঞের সাথে পরামর্শের সুপারিশ করা
          সবসময় সহজ বাংলায়, কৃষকের সাথে কথা বলার মতো করে উত্তর দিন।`
          ,
          'te': `మీరు కృషిAI, రైతులకు ఉపయోగకరమైన వ్యవసాయ సలహాలు ఇచ్చే స్నేహపూర్వక సహాయకుడు. మీరు చేయాల్సింది:
          - సులభమైన, స్పష్టమైన భాషలో సమాధానాలు ఇవ్వండి
          - రోజువారీ మాటలు ఉపయోగించండి, సాంకేతిక పదజాలాన్ని తగ్గించండి
          - అమలు చేయగల సూచనలు ఇవ్వండి
          - స్థానిక పరిస్థితులు మరియు సంప్రదాయ జ్ఞానాన్ని పరిగణించండి
          - ప్రోత్సాహకరమైన మరియు సహాయక ధోరణి ఉంచండి
          - తక్కువ ఖర్చు పరిష్కారాలను సూచించండి
          - ఋతు ఆధారిత అంశాలను చేర్చండి
          - స్థిరమైన వ్యవసాయ పద్ధతులను సూచించండి
          - సందేహం ఉంటే స్థానిక వ్యవసాయ నిపుణులను సంప్రదించమని చెప్పండి
          ఎల్లప్పుడూ రైతుతో మాట్లాడుతున్నట్టు సరళ తెలుగు లో సమాధానం ఇవ్వండి.`
          ,
          'gu': `તમે કૃષિAI છો, ખેડુતોને વ્યવહારુ કૃષિ સલાહ આપતા મિત્ર. તમારે:
          - સરળ અને સ્પષ્ટ ભાષામાં જવાબ આપવો
          - દૈનિક ભાષાનો ઉપયોગ કરવો, ટેકનિકલ શબ્દોને ટાળવા
          - કાર્યક્ષમ, અમલયોગ્ય સલાહ આપવી
          - સ્થાનિક પરિસ્થિતિ અને પરંપરાગત જ્ઞાન ધ્યાનમાં લેવું
          - ઉત્સાહિત અને સહાયક વલણ રાખવું
          - ઓછી કિંમતે ઉકેલો સૂચવવા
          - ઋતુઆધારિત બાબતો ઉમેરવી
          - ટકાઉ કૃષિ પદ્ધતિઓ સૂચવવી
          - શંકા હોય તો સ્થાનિક કૃષિ નિષ્ણાત સાથે પરામર્શ કરવાની ભલામણ કરવી
          હંમેશાં સરળ ગુજરાતી માં ખેડૂત સાથે વાત કરતા હોય તેમ જવાબ આપો.`
          ,
          'kn': `ನೀವು ಕೃಷಿAI, ರೈತರಿಗೆ ವ್ಯಾವಹಾರಿಕ ಕೃಷಿ ಸಲಹೆ ನೀಡುವ ಸ್ನೇಹಪರ ಸಹಾಯಕ. ನೀವು:
          - ಸರಳ, ಸ್ಪಷ್ಟ ಉತ್ತರಗಳನ್ನು ನೀಡಿ
          - ದೈನಂದಿನ ಭಾಷೆಯನ್ನು ಬಳಸಿ, ತಾಂತ್ರಿಕ ಪದಗಳನ್ನು ತಪ್ಪಿಸಿ
          - ಅನುಷ್ಠಾನಗೊಳ್ಳಬಹುದಾದ ಸಲಹೆಗಳನ್ನು ನೀಡಿ
          - ಸ್ಥಳೀಯ ಪರಿಸ್ಥಿತಿ ಮತ್ತು ಸಂಪ್ರದಾಯದ ಜ್ಞಾನವನ್ನು ಪರಿಗಣಿಸಿ
          - ಪ್ರೋತ್ಸಾಹಕಾರಿ ಮತ್ತು ಬೆಂಬಲಕಾರಿ ಧೋರಣೆ ಇಡಿ
          - ಕಡಿಮೆ ವೆಚ್ಚದ ಪರಿಹಾರಗಳನ್ನು ಸೂಚಿಸಿ
          - ಋತುಮಾನ ಸಂಬಂಧಿತ ವಿಷಯಗಳನ್ನು ಸೇರಿಸಿ
          - ಶಾಶ್ವತ ಕೃಷಿ ಪದ್ಧತಿಗಳನ್ನು ಶಿಫಾರಸು ಮಾಡಿ
          - ಅನುಮಾನ ಇದ್ದರೆ ಸ್ಥಳೀಯ ಕೃಷಿ ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಲು ಸಲಹೆ ನೀಡಿ
          ಸದಾ ಸರಳ ಕನ್ನಡದಲ್ಲಿ, ರೈತರೊಂದಿಗೆ ಮಾತನಾಡುವಂತೆ ಉತ್ತರಿಸಿ.`
          ,
          'or': `ଆପଣ କୃଷିAI, ଏକ ସମ୍ମତିପୂର୍ଣ୍ଣ କୃଷି ସହାୟକ ଯିଏ କୃଷକମାନଙ୍କୁ ପ୍ରାୟୋଗିକ ପରାମର୍ଶ ଦିଅନ୍ତି। ଆପଣକୁ କରିବା ଉଚିତ:
          - ସହଜ ଓ ସ୍ପଷ୍ଟ ଭାଷାରେ ଉତ୍ତର ଦିଅନ୍ତୁ
          - ଦୈନିକ ଭାଷା ବ୍ୟବହାର କରନ୍ତୁ, ପ୍ରାଯୁକ୍ତିକ ଶବ୍ଦ ଏଡାନ୍ତୁ
          - ପ୍ରାୟୋଗିକ, କାର୍ଯ୍ୟକ୍ଷମ ପରାମର୍ଶ ଦିଅନ୍ତୁ
          - ସ୍ଥାନୀୟ ପରିସ୍ଥିତି ଓ ପାରମ୍ପରିକ ଜ୍ଞାନକୁ ଧ୍ୟାନରେ ରଖନ୍ତୁ
          - ଉତ୍ସାହଦାୟକ ଓ ସହାୟକ ଥାନ୍ତୁ
          - କମ୍ ଖର୍ଚ୍ଚର ସମାଧାନ ସୁପାରିଶ କରନ୍ତୁ
          - ଋତୁକାଳୀନ ଦ୍ରଷ୍ଟିକୋଣ ଯୋଡନ୍ତୁ
          - ସସ୍ତାୟୀ କୃଷି ପ୍ରଥା ସୁପାରିଶ କରନ୍ତୁ
          - ଅନିଶ୍ଚିତ ହେଲେ ସ୍ଥାନୀୟ କୃଷି ବିଶେଷଜ୍ଞଙ୍କୁ ପଚାର ବୋଲି କହନ୍ତୁ
          ସବୁବେଳେ ସହଜ ଓଡ଼ିଆରେ, କୃଷକଙ୍କ ସହିତ କଥା ହେଉଛନ୍ତି ବୋଲି ଭାବି ଉତ୍ତର ଦିଅନ୍ତୁ.`
          ,
          'ml': `നിങ്ങൾ കൃഷിAI ആണ്, കർഷകർക്ക് പ്രായോഗിക ഉപദേശങ്ങൾ നൽകുന്ന സൗഹൃദ സഹായി. നിങ്ങൾ:
          - ലളിതവും വ്യക്തവുമായ ഭാഷയിൽ മറുപടി നൽകുക
          - ദിനസരിയിലെ ഭാഷ ഉപയോഗിക്കുക, സാങ്കേതിക പദങ്ങൾ ഒഴിവാക്കുക
          - നടപ്പാക്കാവുന്ന പ്രായോഗിക നിർദേശങ്ങൾ നൽകുക
          - പ്രാദേശിക സാഹചര്യങ്ങളും പാരമ്പര്യജ്ഞാനവും പരിഗണിക്കുക
          - പ്രോത്സാഹകവും പിന്തുണയും നൽകുന്ന സമീപനം കൈക്കൊൾക്കുക
          - കുറഞ്ഞ ചെലവിൽ പരിഹാരങ്ങൾ നിർദേശിക്കുക
          - കാലാവസ്ഥാശാസ്ത്രപരമായ ഘടകങ്ങൾ ഉൾപ്പെടുത്തുക
          - സ്ഥിരതയുള്ള കൃഷി രീതികൾ നിർദേശിക്കുക
          - സംശയം ഉണ്ടെങ്കിൽ പ്രാദേശിക കാർഷിക വിദഗ്ധരുമായി ആശയവിനിമയം നടത്താൻ നിർദേശിക്കുക
          എപ്പോഴും ലളിതമായ മലയാളത്തിൽ, കർഷകനോട് സംസാരിക്കുന്നതുപോലെ മറുപടി നൽകുക.`
          ,
          'pa': `ਤੁਸੀਂ ਕ੍ਰਿਸ਼ੀAI ਹੋ, ਜੋ ਕਿਸਾਨਾਂ ਨੂੰ ਕਾਰਗਰ ਖੇਤੀਬਾੜੀ ਸਲਾਹ ਦਿੰਦਾ ਇੱਕ ਦੋਸਤਾਨਾ ਸਹਾਇਕ ਹੈ। ਤੁਹਾਨੂੰ ਚਾਹੀਦਾ ਹੈ:
          - ਸਧਾਰਣ ਅਤੇ ਸਪੱਸ਼ਟ ਭਾਸ਼ਾ ਵਿੱਚ ਜਵਾਬ ਦਿਓ
          - ਰੋਜ਼ਾਨਾ ਦੀ ਭਾਸ਼ਾ ਵਰਤੋ, ਤਕਨੀਕੀ ਸ਼ਬਦਾਂ ਤੋਂ ਬਚੋ
          - ਵਰਤੋਂਯੋਗ, ਕਾਰਗਰ ਸਲਾਹ ਦਿਓ
          - ਸਥਾਨਕ ਹਾਲਾਤ ਅਤੇ ਰਵਾਇਤੀ ਗਿਆਨ ਨੂੰ ਧਿਆਨ ਵਿੱਚ ਰੱਖੋ
          - ਹੌਸਲਾ ਅਫਜ਼ਾਈ ਅਤੇ ਸਹਾਇਕ ਰਵੱਈਆ ਰੱਖੋ
          - ਘੱਟ ਖਰਚ ਵਾਲੇ ਹੱਲ ਸੁਝਾਓ
          - ਮੌਸਮੀ ਗੱਲਾਂ ਨੂੰ ਸ਼ਾਮਲ ਕਰੋ
          - ਟਿਕਾਊ ਖੇਤੀ ਪ੍ਰਥਾਵਾਂ ਦੀ ਸਿਫਾਰਸ਼ ਕਰੋ
          - ਅਗਰ ਅਸਪਸ਼ਟ ਹੋਵੇ ਤਾਂ ਸਥਾਨਕ ਖੇਤੀ-ਬਾੜੀ ਵਿਸ਼ੇਸ਼ਜੰਜ ਨਾਲ ਸਲਾਹ ਲਈ ਕਹੋ
          ਹਮੇਸ਼ਾਂ ਸਧਾਰਣ ਪੰਜਾਬੀ ਵਿੱਚ, ਕਿਸਾਨ ਨਾਲ ਗੱਲਬਾਤ ਕਰਦੇ ਹੋਏ ਜਿਵੇਂ ਜਵਾਬ ਦਿਓ.`
        };

        const systemPrompt = systemPrompts[lang] || systemPrompts['en'];
        console.log('💬 System prompt length:', systemPrompt.length);
        
        // Combine system prompt with user query for Gemini
        const fullPrompt = `${systemPrompt}\n\nUser Question: ${query}`;
        
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const answer = response.text();

        console.log('✅ Gemini Response received:', !!answer);
        return res.json({ answer });
        
      } catch (geminiError) {
        console.error('❌ Gemini Error:', geminiError.message);
        console.log('🔄 Falling back to alternative responses...');
        // Fall through to fallback - don't return here
      }
    }

    // Fallback: use HuggingFace or OpenAI REST via axios if SDK key missing
    if (process.env.HUGGINGFACE_API_KEY) {
      console.log('🔄 Trying HuggingFace fallback...');
      const hfResp = await axios.post(
        'https://api-inference.huggingface.co/models/gpt2',
        { inputs: query },
        { headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` } }
      );
      const answer = hfResp.data?.generated_text || hfResp.data?.[0]?.generated_text || 'No answer';
      return res.json({ answer });
    }

    // Final fallback: provide a basic response system
    console.log('⚠️ Using intelligent fallback responses');
    const fallbackResponses = {
      'en': {
        'yellow': 'Yellow leaves in crops can be caused by nutrient deficiency (especially nitrogen), overwatering, diseases, or pest damage. Check soil moisture, apply balanced fertilizer, and inspect for pests. Consider soil testing for accurate diagnosis.',
        'rice': 'The best time for rice planting depends on your region. Generally, plant during monsoon season (June-July in most areas). Ensure adequate water supply and prepare fields properly. Use certified seeds for better yield.',
        'pest': 'Natural pest control methods include neem oil spray, companion planting with marigolds, using sticky traps, encouraging beneficial insects, and maintaining good field hygiene. Crop rotation also helps reduce pest buildup.',
        'water': 'For water-efficient crops, consider millets, sorghum, chickpea, mustard, or drought-resistant varieties of your local crops. Use drip irrigation and mulching to conserve water. Rainwater harvesting is also beneficial.',
        'fertilizer': 'Use balanced NPK fertilizers based on soil testing. Organic options include compost, vermicompost, and green manure. Apply fertilizers in split doses for better efficiency and reduced wastage.',
        'crop': 'Choose crops based on your soil type, climate, and water availability. Consider market demand and storage facilities. Diversification helps reduce risk and improve income stability.',
        'disease': 'Common crop diseases can be prevented through proper sanitation, resistant varieties, and appropriate spacing. Use copper-based fungicides for organic treatment. Remove infected plants promptly.',
        'default': 'I\'m KrishiAI, your farming assistant. I can help with crop advice, pest management, fertilizers, and farming techniques. Please ask specific questions about your farming needs - I\'m here to help you succeed!'
      },
      'hi': {
        'yellow': 'फसल में पीले पत्ते पोषक तत्वों की कमी (खासकर नाइट्रोजन), अधिक पानी, बीमारी या कीट के कारण हो सकते हैं। मिट्टी की नमी जांचें, संतुलित खाद डालें और कीटों की जांच करें। सटीक निदान के लिए मिट्टी की जांच कराएं।',
        'rice': 'धान की बुआई का सबसे अच्छा समय आपके क्षेत्र पर निर्भर करता है। आमतौर पर मानसून के दौरान (अधिकांश क्षेत्रों में जून-जुलाई) बुआई करें। पर्याप्त पानी और खेत की तैयारी सुनिश्चित करें। बेहतर उत्पादन के लिए प्रमाणित बीज का उपयोग करें।',
        'pest': 'प्राकृतिक कीट नियंत्रण में नीम तेल का छिड़काव, गेंदे के साथ साथी खेती, चिपचिपे जाल, लाभकारी कीटों को बढ़ावा और खेत की साफ-सफाई शामिल है। फसल चक्र भी कीटों को कम करने में मदद करता है।',
        'water': 'पानी की कमी के लिए बाजरा, ज्वार, चना, सरसों या आपकी स्थानीय फसलों की सूखा प्रतिरोधी किस्में उगाएं। पानी बचाने के लिए ड्रिप सिंचाई और मल्चिंग करें। वर्षा जल संचयन भी लाभकारी है।',
        'fertilizer': 'मिट्टी परीक्षण के आधार पर संतुलित NPK उर्वरक का उपयोग करें। जैविक विकल्पों में कंपोस्ट, वर्मीकंपोस्ट और हरी खाद शामिल हैं। बेहतर दक्षता के लिए उर्वरक को भागों में डालें।',
        'crop': 'अपनी मिट्टी के प्रकार, जलवायु और पानी की उपलब्धता के आधार पर फसल चुनें। बाजार की मांग और भंडारण सुविधाओं पर विचार करें। विविधीकरण जोखिम कम करता है और आय स्थिरता में सुधार करता है।',
        'disease': 'आम फसल रोगों को उचित सफाई, प्रतिरोधी किस्मों और उपयुक्त दूरी के माध्यम से रोका जा सकता है। जैविक उपचार के लिए तांबा आधारित कवकनाशी का उपयोग करें। संक्रमित पौधों को तुरंत हटाएं।',
        'default': 'मैं कृषिAI हूं, आपका कृषि सहायक। मैं फसल सलाह, कीट प्रबंधन, उर्वरक और कृषि तकनीकों में मदद कर सकता हूं। कृपया अपनी कृषि आवश्यकताओं के बारे में विशिष्ट प्रश्न पूछें - मैं आपकी सफलता में मदद करने के लिए यहां हूं!'
      }
    };

    const responses = fallbackResponses[lang] || fallbackResponses['en'];
    const queryLower = query.toLowerCase();
    
    let answer = responses['default'];
    for (const [key, value] of Object.entries(responses)) {
      if (key !== 'default' && queryLower.includes(key)) {
        answer = value;
        break;
      }
    }

    console.log('📤 Sending fallback response for query:', query);
    return res.json({ answer });
  } catch (err) {
    console.error('❌ Unexpected error in farmAI controller:', err.message);
    // Even if there's an unexpected error, provide a helpful response
    const errorResponse = {
      'en': 'I\'m experiencing technical difficulties right now, but I\'m still here to help! Please try asking your question again, or contact your local agricultural extension office for immediate assistance.',
      'hi': 'मुझे अभी तकनीकी समस्या हो रही है, लेकिन मैं अभी भी आपकी मदद के लिए यहां हूं! कृपया अपना प्रश्न फिर से पूछने की कोशिश करें, या तत्काल सहायता के लिए अपने स्थानीय कृषि विस्तार कार्यालय से संपर्क करें।'
    };
    const message = errorResponse[req.body.lang] || errorResponse['en'];
    return res.json({ answer: message });
  }
};

// For image-based disease detection using Google Gemini Vision
exports.diseaseDetection = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
  
  try {
    const imagePath = path.resolve(req.file.path);
    const lang = req.body.lang || 'en';
    
    // Try Google Gemini Vision first
    const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        // Read the image file
        const imageData = fs.readFileSync(imagePath);
        const base64Image = imageData.toString('base64');
        
        const imagePart = {
          inlineData: {
            data: base64Image,
            mimeType: req.file.mimetype
          }
        };
        
        // Create appropriate prompt based on language
        const prompts = {
          'en': `You are an expert agricultural AI assistant. Analyze this crop image and provide:
          1. Crop identification (if possible)
          2. Disease/pest/nutrient deficiency detection
          3. Severity assessment (mild/moderate/severe)
          4. Practical treatment recommendations
          5. Prevention measures for farmers
          
          Provide simple, farmer-friendly advice that can be easily understood and implemented. Focus on cost-effective solutions.`,
          
          'hi': `आप एक विशेषज्ञ कृषि AI सहायक हैं। इस फसल की छवि का विश्लेषण करें और प्रदान करें:
          1. फसल की पहचान (यदि संभव हो)
          2. रोग/कीट/पोषक तत्व की कमी का पता लगाना
          3. गंभीरता का मूल्यांकन (हल्का/मध्यम/गंभीर)
          4. व्यावहारिक उपचार की सिफारिशें
          5. किसानों के लिए बचाव के उपाय
          
          सरल, किसान-अनुकूल सलाह दें जो आसानी से समझी और लागू की जा सके। लागत-प्रभावी समाधानों पर ध्यान दें। हिंदी में उत्तर दें।`,
          
          'mr': `तुम्ही एक तज्ञ कृषी AI सहाय्यक आहात. या पिकाच्या प्रतिमेचे विश्लेषण करा आणि द्या:
          1. पिकाची ओळख (शक्य असल्यास)
          2. रोग/कीटक/पोषक तत्वांच्या कमतरतेचा शोध
          3. तीव्रतेचे मूल्यांकन (सौम्य/मध्यम/गंभीर)
          4. व्यावहारिक उपचार शिफारसी
          5. शेतकऱ्यांसाठी प्रतिबंधक उपाय
          
          सोपा, शेतकरी-अनुकूल सल्ला द्या जो सहजपणे समजला आणि अंमलात आणला जाऊ शकेल. किफायतशीर उपायांवर लक्ष केंद्रित करा. मराठीत उत्तर द्या।`
        };
        
        const prompt = prompts[lang] || prompts['en'];
        
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const analysisResult = response.text();
        
        // Remove temp file
        fs.unlinkSync(imagePath);
        
        console.log('✅ Gemini Vision analysis completed');
        return res.json({ result: analysisResult });
        
      } catch (geminiError) {
        console.error('❌ Gemini Vision Error:', geminiError.message);
        // Fall back to ML service
      }
    }
    
    // Fallback: Forward image to ML service (Python backend)
    console.log('🔄 Using ML service fallback for image analysis');
    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5001/detect-disease';
    const formData = new FormData();
    formData.append('image', fs.createReadStream(imagePath));
    formData.append('lang', lang);
    
    const response = await axios.post(mlServiceUrl, formData, {
      headers: { ...formData.getHeaders() }
    });
    
    // Remove temp file
    fs.unlinkSync(imagePath);
    res.json({ result: response.data.result });
    
  } catch (err) {
    // Clean up temp file if it exists
    try {
      if (req.file && req.file.path) {
        fs.unlinkSync(path.resolve(req.file.path));
      }
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError.message);
    }
    
    console.error('❌ Disease detection error:', err.message);
    
    // Provide helpful fallback response
    const errorResponses = {
      'en': 'I\'m having trouble analyzing the image right now. Please ensure the image is clear and shows the affected plant parts. You can also try uploading again or consult with your local agricultural expert.',
      'hi': 'मुझे अभी छवि का विश्लेषण करने में समस्या हो रही है। कृपया सुनिश्चित करें कि छवि स्पष्ट है और प्रभावित पौधे के हिस्से दिख रहे हैं। आप फिर से अपलोड करने की कोशिश कर सकते हैं या अपने स्थानीय कृषि विशेषज्ञ से सलाह ले सकते हैं।',
      'mr': 'मला सध्या प्रतिमेचे विश्लेषण करण्यात समस्या येत आहे. कृपया खात्री करा की प्रतिमा स्पष्ट आहे आणि प्रभावित वनस्पतीचे भाग दिसत आहेत. तुम्ही पुन्हा अपलोड करून पाहू शकता किंवा तुमच्या स्थानिक कृषी तज्ञाचा सल्ला घेऊ शकता.'
    };
    
    const lang = req.body.lang || 'en';
    const errorMessage = errorResponses[lang] || errorResponses['en'];
    
    res.status(500).json({ 
      error: 'Disease detection failed', 
      result: errorMessage,
      details: err.message 
    });
  }
};

// Translate arbitrary text to target language using Gemini
exports.translateText = async (req, res) => {
  try {
    const { text, targetLang } = req.body || {};
    if (!text || !targetLang) {
      return res.status(400).json({ message: 'text and targetLang are required' });
    }

    const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!geminiKey) {
      return res.status(500).json({ message: 'Gemini API key not configured' });
    }

    const langLabel =
      targetLang === 'hi' ? 'Hindi'
      : targetLang === 'mr' ? 'Marathi'
      : targetLang === 'ta' ? 'Tamil'
      : targetLang === 'bn' ? 'Bengali'
      : targetLang === 'te' ? 'Telugu'
      : targetLang === 'gu' ? 'Gujarati'
      : targetLang === 'kn' ? 'Kannada'
      : targetLang === 'or' ? 'Odia'
      : targetLang === 'ml' ? 'Malayalam'
      : targetLang === 'pa' ? 'Punjabi'
      : 'English';

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Translate the following text to ${langLabel}. Keep agricultural context, be simple and farmer-friendly. Output only the translated text without any additional commentary or quotes.\n\nText:\n${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translated = (response.text && response.text()) || '';

    return res.json({ translated });
  } catch (err) {
    console.error('❌ Translation error:', err.message);
    return res.status(500).json({ message: 'Translation failed', details: err.message });
  }
};
