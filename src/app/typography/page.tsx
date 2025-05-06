import {
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyP,
  TypographyLead,
  TypographyLarge,
  TypographySmall,
  TypographyMuted,
} from "@/components/ui/typography"

export default function TypographyShowcase() {
  return (
    <div className="container py-12 max-w-4xl mx-auto">
      <TypographyH1 className="mb-8">Typography System</TypographyH1>
      
      <div className="grid gap-12">
        <section>
          <TypographyH2 className="mb-4 border-b pb-2">Headings</TypographyH2>
          <div className="grid gap-4">
            <TypographyH1>Heading 1 - Gilroy</TypographyH1>
            <TypographyH2>Heading 2 - Gilroy</TypographyH2>
            <TypographyH3>Heading 3 - Gilroy</TypographyH3>
            <TypographyH4>Heading 4 - Gilroy</TypographyH4>
            <h5 className="font-heading text-lg font-medium leading-snug">Heading 5 - Gilroy</h5>
            <h6 className="font-heading text-base font-medium leading-normal">Heading 6 - Gilroy</h6>
          </div>
        </section>

        <section>
          <TypographyH2 className="mb-4 border-b pb-2">Body Text</TypographyH2>
          <div className="grid gap-8">
            <div>
              <TypographyLead className="mb-4">
                Lead paragraph - Inter. This text is designed to stand out as an introduction or key message.
                It uses increased font size and lighter weight to create visual hierarchy.
              </TypographyLead>
              
              <TypographyP>
                Body text - Inter. This is a standard paragraph with comfortable line height and optimal
                character width for reading. Opal's typography system uses Inter for all body text to ensure
                excellent readability across devices and screen sizes.
              </TypographyP>

              <TypographyP>
                Multiple paragraphs maintain consistent spacing to create a comfortable reading rhythm.
                The vertical spacing between paragraphs creates visual breathing room while maintaining
                the relationship between related content.
              </TypographyP>
            </div>

            <div>
              <TypographyH3 className="mb-2">Text Variations</TypographyH3>
              <div className="grid gap-4">
                <TypographyLarge>
                  Large text - Inter. Slightly larger than standard body text but not as prominent as lead text.
                </TypographyLarge>
                
                <TypographyP>Standard text - Inter. The default size for most content.</TypographyP>
                
                <TypographySmall>
                  Small text - Inter. Used for less important information, captions, or supporting text.
                </TypographySmall>
                
                <TypographyMuted>
                  Muted text - Inter. Used for secondary information with reduced visual prominence.
                </TypographyMuted>
              </div>
            </div>
          </div>
        </section>
      
        <section>
          <TypographyH2 className="mb-4 border-b pb-2">Type Scale & Hierarchy</TypographyH2>
          <TypographyP>
            The typography system uses a purposeful combination of font choices, weights, sizes, and spacing
            to create clear visual hierarchy. Headings use Gilroy for a distinctive, modern feel, while
            body text uses Inter for optimal readability.
          </TypographyP>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
            <div>
              <TypographyH3 className="mb-2">Headings</TypographyH3>
              <ul className="space-y-2">
                <li>
                  <strong>H1:</strong> 2.25rem/3rem (36px/48px) - Gilroy ExtraBold
                </li>
                <li>
                  <strong>H2:</strong> 1.875rem/2.25rem (30px/36px) - Gilroy Bold
                </li>
                <li>
                  <strong>H3:</strong> 1.5rem/2rem (24px/32px) - Gilroy SemiBold
                </li>
                <li>
                  <strong>H4:</strong> 1.25rem/1.75rem (20px/28px) - Gilroy SemiBold
                </li>
                <li>
                  <strong>H5:</strong> 1.125rem/1.75rem (18px/28px) - Gilroy Medium
                </li>
                <li>
                  <strong>H6:</strong> 1rem/1.5rem (16px/24px) - Gilroy Medium
                </li>
              </ul>
            </div>
            
            <div>
              <TypographyH3 className="mb-2">Body Text</TypographyH3>
              <ul className="space-y-2">
                <li>
                  <strong>Lead:</strong> 1.25rem/1.625rem (20px/26px) - Inter Regular
                </li>
                <li>
                  <strong>Large:</strong> 1.125rem/1.75rem (18px/28px) - Inter Regular
                </li>
                <li>
                  <strong>Body:</strong> 1rem/1.5rem (16px/24px) - Inter Regular
                </li>
                <li>
                  <strong>Small:</strong> 0.875rem/1.25rem (14px/20px) - Inter Regular
                </li>
                <li>
                  <strong>Extra Small:</strong> 0.75rem/1rem (12px/16px) - Inter Regular
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
} 