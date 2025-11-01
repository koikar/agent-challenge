/**
 * Apps SDK Component Library for Brand Content
 * Reusable, standardized components optimized for ChatGPT Apps SDK
 */

export type { AppsSdkComponentProps } from "./base-components";
// Base Components
export {
  AppsSdkAlert,
  AppsSdkBadge,
  AppsSdkCodeBlock,
  AppsSdkContainer,
  AppsSdkDivider,
  AppsSdkHeading,
  AppsSdkLink,
  AppsSdkList,
  AppsSdkTable,
  AppsSdkText,
} from "./base-components";

// Specialized Content Renderers
export {
  ApiSpecRenderer,
  BlogPostRenderer,
  ContentRenderer,
  DocumentationRenderer,
  GenericContentRenderer,
  SupportRenderer,
} from "./content-renderers";

// Types
export type { MultimediaAsset } from "./multimedia-components";
// Multimedia Components
export {
  AppsSdkDocument,
  AppsSdkGallery,
  AppsSdkImage,
  AppsSdkMultimedia,
  AppsSdkVideo,
} from "./multimedia-components";

/**
 * Component Usage Guide:
 *
 * 1. Basic Content:
 *    <AppsSdkContainer brandName="Nike" brandColor="#000">
 *      <AppsSdkHeading level={1}>Title</AppsSdkHeading>
 *      <AppsSdkText>Content...</AppsSdkText>
 *    </AppsSdkContainer>
 *
 * 2. Multimedia Content:
 *    <AppsSdkMultimedia assets={multimediaAssets} />
 *
 * 3. Specialized Rendering:
 *    <ContentRenderer
 *      content={processedContent}
 *      brandName="Nike"
 *      brandColor="#000"
 *    />
 *
 * 4. Individual Renderers:
 *    <BlogPostRenderer content={blogContent} brandName="Nike" />
 *    <DocumentationRenderer content={docsContent} brandName="Nike" />
 *    <ApiSpecRenderer content={apiContent} brandName="Nike" />
 */
