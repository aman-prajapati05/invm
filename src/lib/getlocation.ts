// lib/geolocation.ts
export async function getLocationFromIP(ipAddress: string): Promise<string> {
  try {
    // Skip for local/private IPs
    if (ipAddress === 'Unknown' || 
        ipAddress.startsWith('127.') || 
        ipAddress.startsWith('192.168.') || 
        ipAddress.startsWith('10.') || 
        ipAddress === '::1') {
      return 'Local/Private Network';
    }

    // Using a free IP geolocation service (you can use others like ipapi.co, etc.)
    const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
    
    if (!response.ok) {
      throw new Error('Geolocation service unavailable');
    }
    
    const data = await response.json();
    
    if (data.city && data.country_name) {
      return `${data.city}, ${data.country_name}`;
    } else if (data.country_name) {
      return data.country_name;
    } else {
      return 'Unknown Location';
    }
  } catch (error) {
    console.error('Error getting location from IP:', error);
    return 'Unknown Location';
  }
}