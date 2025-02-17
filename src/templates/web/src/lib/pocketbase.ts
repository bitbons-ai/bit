import PocketBase from 'pocketbase';

const PB_URL = import.meta.env.POCKETBASE_URL || process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';

/**
 * Creates a new PocketBase client instance
 * @returns PocketBase client configured with the correct URL
 */
export function createClient(): PocketBase {
  return new PocketBase(PB_URL);
}

/**
 * Gets the PocketBase server health information
 * This demonstrates how to make API calls to PocketBase
 * using a public endpoint that doesn't require authentication
 * 
 * Example usage:
 * ```ts
 * const health = await getServerHealth();
 * console.log('Server status:', health.code);
 * console.log('Server message:', health.message);
 * ```
 * 
 * @returns The health check response or null if failed
 */
export async function getServerHealth() {
  const pb = createClient();
  
  try {
    const health = await pb.health.check();
    return health;
  } catch (error) {
    console.error('Failed to get server health:', error);
    return null;
  }
}

/**
 * Example: How to get a record from a collection
 * 
 * This is just an example to show the pattern for accessing collections.
 * Replace 'pages' with your actual collection name and adjust the
 * types and fields according to your schema.
 * 
 * First, create an interface for your record type:
 * ```ts
 * interface Page {
 *   id: string;
 *   slug: string;
 *   title: string;
 *   content: string;
 *   created: string;
 *   updated: string;
 * }
 * 
 * // Then create a function to fetch the record:
 * async function getPageBySlug(slug: string): Promise<Page | null> {
 *   const pb = createClient();
 *   
 *   try {
 *     // Using getFirstListItem to find by custom field
 *     const page = await pb.collection('pages').getFirstListItem<Page>(`slug = "${slug}"`);
 *     return page;
 *   } catch (error) {
 *     console.error('Failed to get page:', error);
 *     return null;
 *   }
 * }
 * 
 * // Usage in your component:
 * const page = await getPageBySlug('about-us');
 * if (page) {
 *   console.log('Page title:', page.title);
 *   console.log('Page content:', page.content);
 * }
 * 
 * // Or using getOne if you have the ID:
 * const page = await pb.collection('pages').getOne<Page>('RECORD_ID');
 * 
 * // Or list multiple pages:
 * const pages = await pb.collection('pages').getList<Page>(1, 20, {
 *   filter: 'created >= "2024-01-01"',
 *   sort: '-created',
 * });
 * ```
 */