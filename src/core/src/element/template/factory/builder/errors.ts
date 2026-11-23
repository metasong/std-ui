/** The "...near" excerpt appended to scanner messages. */
export const near = (text: string): string => `near "...${text.slice(-40)}"`;
