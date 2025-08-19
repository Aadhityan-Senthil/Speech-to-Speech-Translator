import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SpeechRequest {
  audio: Blob;
  model: string;
  language: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Speech-to-Speech processing started');
    
    // Parse the form data
    const formData = await req.formData();
    const audioBlob = formData.get('audio') as File;
    const model = formData.get('model') as string;
    const language = formData.get('language') as string;

    if (!audioBlob || !model || !language) {
      throw new Error('Missing required parameters: audio, model, or language');
    }

    console.log(`Processing with model: ${model}, language: ${language}`);

    // Convert audio to base64 for processing
    const audioBuffer = await audioBlob.arrayBuffer();
    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    // Mock speech processing - In a real implementation, you would:
    // 1. Send audio to the selected speech model API
    // 2. Get transcription and generate response
    // 3. Convert response back to audio
    
    let processedResponse;
    const startTime = Date.now();

    switch (model) {
      case 'moshi':
        processedResponse = await processMoshiModel(audioBase64, language);
        break;
      case 'ultravox':
        processedResponse = await processUltravoxModel(audioBase64, language);
        break;
      case 'spirit_lm':
        processedResponse = await processSpiritLMModel(audioBase64, language);
        break;
      default:
        throw new Error(`Unsupported model: ${model}`);
    }

    const processingTime = Date.now() - startTime;
    console.log(`Processing completed in ${processingTime}ms`);

    // For demo purposes, return mock data
    const response = {
      transcript: processedResponse.transcript,
      audioUrl: processedResponse.audioUrl,
      latency: processingTime,
      model: model,
      language: language,
      success: true
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in speech-to-speech processing:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Mock processing functions for different models
async function processMoshiModel(audioBase64: string, language: string) {
  console.log('Processing with Moshi (Full-duplex) model');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
  
  const greetings = {
    'en': 'Hello! I heard you speaking. This is Moshi responding with full-duplex conversation capability.',
    'ta': 'வணக்கம்! நீங்கள் பேசுவதை நான் கேட்டேன். இது மோஷி முழு-டுப்ளெக்ஸ் உரையாடல் திறனுடன் பதிலளிக்கிறது.',
    'es': '¡Hola! Te escuché hablar. Este es Moshi respondiendo con capacidad de conversación full-duplex.',
    'fr': 'Bonjour! Je vous ai entendu parler. Voici Moshi répondant avec une capacité de conversation full-duplex.',
    'de': 'Hallo! Ich habe Sie sprechen hören. Das ist Moshi, der mit Full-Duplex-Gesprächsfähigkeit antwortet.'
  };

  return {
    transcript: greetings[language as keyof typeof greetings] || greetings['en'],
    audioUrl: generateMockAudioUrl('moshi', language)
  };
}

async function processUltravoxModel(audioBase64: string, language: string) {
  console.log('Processing with Ultravox (Speech LLM) model');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 300));
  
  const responses = {
    'en': 'Ultravox here! As a speech-extended language model, I can understand and respond to your speech with enhanced linguistic capabilities.',
    'ta': 'அல்ட்ராவோக்ஸ் இங்கே! ஒரு பேச்சு-விரிவாக்கப்பட்ட மொழி மாதிரியாக, மேம்பட்ட மொழியியல் திறன்களுடன் உங்கள் பேச்சை புரிந்துகொண்டு பதிலளிக்க முடியும்.',
    'es': '¡Ultravox aquí! Como modelo de lenguaje extendido por voz, puedo entender y responder a tu habla con capacidades lingüísticas mejoradas.',
    'fr': 'Ultravox ici! En tant que modèle de langage étendu par la parole, je peux comprendre et répondre à votre parole avec des capacités linguistiques améliorées.',
    'de': 'Ultravox hier! Als spracherweiterte Sprachmodell kann ich Ihre Sprache verstehen und mit erweiterten sprachlichen Fähigkeiten antworten.'
  };

  return {
    transcript: responses[language as keyof typeof responses] || responses['en'],
    audioUrl: generateMockAudioUrl('ultravox', language)
  };
}

async function processSpiritLMModel(audioBase64: string, language: string) {
  console.log('Processing with Spirit LM (Expressive) model');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 400));
  
  const responses = {
    'en': 'Spirit LM speaking! I specialize in expressive speech-text fusion, bringing emotion and nuance to our conversation.',
    'ta': 'ஸ்பிரிட் எல்எம் பேசுகிறது! வெளிப்பாடு நிறைந்த பேச்சு-உரை இணைப்பில் நான் நிபுணத்துவம் பெற்றுள்ளேன், உணர்ச்சி மற்றும் நுணுக்கத்தை உங்கள் உரையாடலுக்கு கொண்டு வருகிறேன்.',
    'es': '¡Spirit LM hablando! Me especializo en la fusión expresiva de habla y texto, aportando emoción y matices a nuestra conversación.',
    'fr': 'Spirit LM parle! Je me spécialise dans la fusion expressive parole-texte, apportant émotion et nuance à notre conversation.',
    'de': 'Spirit LM spricht! Ich spezialisiere mich auf ausdrucksstarke Sprach-Text-Fusion und bringe Emotion und Nuancen in unser Gespräch.'
  };

  return {
    transcript: responses[language as keyof typeof responses] || responses['en'],
    audioUrl: generateMockAudioUrl('spirit_lm', language)
  };
}

function generateMockAudioUrl(model: string, language: string): string {
  // In a real implementation, this would return the actual generated audio file URL
  // For demo purposes, we return a mock URL
  const timestamp = Date.now();
  return `https://mock-audio-storage.com/${model}/${language}/${timestamp}.wav`;
}