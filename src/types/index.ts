export interface UserProfile {
    email: string;
    plan: 'trial' | 'premium';
    credits: number;
    created_at: string;
}

export interface GenerationConfig {
    apiKey?: string;
    gender: string;
    category: string;
    pose: string;
    background: string;
    cameraAngle?: string;
    modelImage?: string;
    isFreeTrial?: boolean;
}

export interface AdminStats {
    totalUsers: number;
    activePlans: any[];
    totalGenerations: number;
    apiStatus: string;
}

export interface Subscription {
    id: string;
    email: string;
    plan: string;
    status: string;
    generations_count: number;
    created_at: string;
}

export interface Package {
    id: string;
    name: string;
    price: number;
    limit: number;
}
