import "server-only";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from "docx";

type TipTapNode = {
  type: string;
  content?: TipTapNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  attrs?: Record<string, unknown>;
};

function nodeToRuns(node: TipTapNode): TextRun[] {
  if (node.type === "text") {
    const marks = node.marks ?? [];
    return [
      new TextRun({
        text: node.text ?? "",
        bold: marks.some((m) => m.type === "bold"),
        italics: marks.some((m) => m.type === "italic"),
        underline: marks.some((m) => m.type === "underline") ? {} : undefined,
      }),
    ];
  }
  if (node.content) {
    return node.content.flatMap((child) => nodeToRuns(child));
  }
  return [];
}

function tiptapNodeToDocxParagraph(node: TipTapNode): Paragraph | Paragraph[] {
  const textAlign = node.attrs?.textAlign as string | undefined;
  const alignment =
    textAlign === "center"
      ? AlignmentType.CENTER
      : textAlign === "right"
      ? AlignmentType.RIGHT
      : AlignmentType.LEFT;

  switch (node.type) {
    case "heading": {
      const level = (node.attrs?.level as number) ?? 1;
      return new Paragraph({
        children: (node.content ?? []).flatMap(nodeToRuns),
        heading:
          level === 1
            ? HeadingLevel.HEADING_1
            : level === 2
            ? HeadingLevel.HEADING_2
            : HeadingLevel.HEADING_3,
        alignment,
      });
    }
    case "blockquote": {
      const inner = node.content ?? [];
      return inner.map(
        (child) =>
          new Paragraph({
            children: (child.content ?? []).flatMap(nodeToRuns),
            indent: { left: 720 },
            border: {
              left: { color: "C9A84C", size: 6, style: BorderStyle.SINGLE, space: 8 },
            },
          })
      );
    }
    case "bulletList": {
      return (node.content ?? []).flatMap((li) =>
        (li.content ?? []).map(
          (p) =>
            new Paragraph({
              children: (p.content ?? []).flatMap(nodeToRuns),
              bullet: { level: 0 },
            })
        )
      );
    }
    case "orderedList": {
      return (node.content ?? []).flatMap((li) =>
        (li.content ?? []).map(
          (p) =>
            new Paragraph({
              children: (p.content ?? []).flatMap(nodeToRuns),
              numbering: { reference: "legal-numbering", level: 0 },
            })
        )
      );
    }
    case "horizontalRule": {
      return new Paragraph({
        text: "",
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000", space: 1 },
        },
      });
    }
    case "paragraph":
    default: {
      return new Paragraph({
        children: (node.content ?? []).flatMap(nodeToRuns),
        alignment,
        spacing: { after: 120 },
      });
    }
  }
}

function tiptapJsonToDocxParagraphs(json: TipTapNode): Paragraph[] {
  const doc = json.type === "doc" ? json : { type: "doc", content: [json] };
  return (doc.content ?? []).flatMap((node) => {
    const result = tiptapNodeToDocxParagraph(node);
    return Array.isArray(result) ? result : [result];
  });
}

export async function exportToDocx(
  title: string,
  contentJson: string
): Promise<Buffer> {
  let parsed: TipTapNode;
  try {
    parsed = JSON.parse(contentJson);
  } catch {
    parsed = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: contentJson }] }],
    };
  }

  const paragraphs = tiptapJsonToDocxParagraphs(parsed);

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "legal-numbering",
          levels: [
            {
              level: 0,
              format: "decimal",
              text: "%1.",
              alignment: AlignmentType.LEFT,
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1134, bottom: 1440, left: 1134 },
          },
        },
        children: [
          new Paragraph({
            children: [new TextRun({ text: title, bold: true, size: 28 })],
            heading: HeadingLevel.TITLE,
            spacing: { after: 400 },
          }),
          ...paragraphs,
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer as unknown as Buffer;
}
