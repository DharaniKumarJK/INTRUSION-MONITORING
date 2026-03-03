import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface LoginAttemptData {
  attempted_username: string;
  actual_username?: string;
  attempt_success: boolean;
  ip_address?: string;
  user_agent?: string;
  website_domain?: string;
}

const commonSubstitutions: { [key: string]: string[] } = {
  'a': ['@', '4'],
  'e': ['3'],
  'i': ['1', '!', '|'],
  'o': ['0'],
  's': ['5', '$'],
  't': ['7', '+'],
  'l': ['1', '|'],
  'g': ['9'],
  'b': ['8'],
};

function detectBypassAttempt(attempted: string, actual: string): { detected: boolean; details: any } {
  const attemptedLower = attempted.toLowerCase();
  const actualLower = actual.toLowerCase();

  if (attemptedLower === actualLower) {
    return { detected: false, details: {} };
  }

  const substitutions: any[] = [];

  for (let i = 0; i < actualLower.length && i < attemptedLower.length; i++) {
    const actualChar = actualLower[i];
    const attemptedChar = attemptedLower[i];

    if (actualChar !== attemptedChar) {
      if (commonSubstitutions[actualChar]?.includes(attemptedChar)) {
        substitutions.push({
          position: i,
          original: actualChar,
          substitution: attemptedChar,
          type: 'character_substitution'
        });
      }
    }
  }

  if (substitutions.length > 0) {
    return {
      detected: true,
      details: {
        substitutions,
        attempted_value: attempted,
        actual_value: actual,
        match_percentage: calculateSimilarity(attempted, actual)
      }
    };
  }

  const similarity = calculateSimilarity(attempted, actual);
  if (similarity > 0.7 && similarity < 1.0) {
    return {
      detected: true,
      details: {
        type: 'high_similarity',
        attempted_value: attempted,
        actual_value: actual,
        match_percentage: similarity
      }
    };
  }

  return { detected: false, details: {} };
}

function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const data: LoginAttemptData = await req.json();

    let bypassDetected = false;
    let bypassDetails = {};
    let actualUserId = null;

    if (data.actual_username) {
      const bypassCheck = detectBypassAttempt(data.attempted_username, data.actual_username);
      bypassDetected = bypassCheck.detected;
      bypassDetails = bypassCheck.details;

      const { data: userData } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', data.actual_username)
        .maybeSingle();

      if (userData) {
        actualUserId = userData.id;
      }
    }

    const { error: insertError } = await supabase
      .from('login_attempts')
      .insert({
        attempted_username: data.attempted_username,
        actual_user_id: actualUserId,
        attempt_success: data.attempt_success,
        bypass_detected: bypassDetected,
        bypass_details: bypassDetails,
        ip_address: data.ip_address,
        user_agent: data.user_agent,
        website_domain: data.website_domain,
      });

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        bypass_detected: bypassDetected,
        message: 'Login attempt tracked successfully'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
