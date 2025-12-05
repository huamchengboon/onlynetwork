// MAC address validation (format: XX:XX:XX:XX:XX:XX)
export function isValidMac(mac: string): boolean {
    const macRegex = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;
    return macRegex.test(mac);
}

// IP address validation (IPv4)
export function isValidIp(ip: string): boolean {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    
    return parts.every(part => {
        const num = parseInt(part, 10);
        return !isNaN(num) && num >= 0 && num <= 255 && part === num.toString();
    });
}

// CIDR notation validation (e.g., 192.168.1.1/24)
export function isValidCidr(cidr: string): boolean {
    const parts = cidr.split('/');
    if (parts.length !== 2) return false;
    
    const [ip, prefix] = parts;
    if (!isValidIp(ip)) return false;
    
    const prefixNum = parseInt(prefix, 10);
    return !isNaN(prefixNum) && prefixNum >= 0 && prefixNum <= 32;
}

// VLAN ID validation (1-4094)
export function isValidVlanId(vlan: number): boolean {
    return Number.isInteger(vlan) && vlan >= 1 && vlan <= 4094;
}

// Generate a random MAC address
export function generateMac(): string {
    const hexDigits = '0123456789ABCDEF';
    let mac = '02'; // Locally administered, unicast
    for (let i = 0; i < 5; i++) {
        mac += ':' + hexDigits[Math.floor(Math.random() * 16)] + hexDigits[Math.floor(Math.random() * 16)];
    }
    return mac;
}

// Generate a default IP for a given node index
export function generateDefaultIp(index: number): string {
    return `192.168.1.${10 + index}/24`;
}
