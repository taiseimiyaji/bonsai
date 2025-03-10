export interface ScrapWithTimeAgo {
    id: string;
    userId: string;
    content: string;
    user: {
        id: string;
        name: string;
        image: string;
    }
    ogpData: {
        link: string;
        image: string | null;
        title: string | null;
        description: string | null;
    } | null;
    scrapBookId: string;
    categoryId: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    timeAgo: string;
    category: {
        id: string;
        name: string;
    } | null;
}