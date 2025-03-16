export interface ScrapWithTimeAgo {
    id: string;
    userId: string;
    content: string | null;
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
    createdAt: string;
    updatedAt: string;
    timeAgo: string;
    category: {
        id: string;
        name: string;
    } | null;
}