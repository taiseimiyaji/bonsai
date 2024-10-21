export interface ScrapWithTimeAgo {
    id: string;
    userId: string;
    title: string;
    content: string | null;
    link: string | null;
    image: string | null;
    ogpData: {
        image: string;
    } | null;
    scrapBookId: string;
    categoryId: string | null;
    createdAt: Date;
    updatedAt: Date;
    timeAgo: string;
    category: {
        id: string;
        name: string;
    } | null;
}