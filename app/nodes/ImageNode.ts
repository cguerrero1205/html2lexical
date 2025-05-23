import { DecoratorNode, NodeKey, SerializedLexicalNode, Spread } from "lexical";

// Definir el tipo para caption
interface ImageCaption {
  editorState: {
    root: {
      type: string;
      format: string;
      indent: number;
      version: number;
      children: unknown[];
      direction: string | null;
    };
  };
}

export type SerializedImageNode = Spread<
  {
    src: string;
    alt?: string;
    width?: number;
    height?: number;
    type: "image";
    version: 1;
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<null> {
  __src: string;
  __alt?: string;
  __width?: number;
  __height?: number;
  __maxWidth?: number;
  __showCaption?: boolean;
  __caption?: ImageCaption;

  static getType(): string {
    return "image";
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__alt,
      node.__width,
      node.__height,
      node.__key,
      node.__maxWidth,
      node.__showCaption,
      node.__caption
    );
  }

  constructor(
    src: string,
    alt?: string,
    width?: number,
    height?: number,
    key?: NodeKey,
    maxWidth: number = 300,
    showCaption: boolean = false,
    caption: ImageCaption = {
      editorState: {
        root: {
          type: "root",
          format: "",
          indent: 0,
          version: 1,
          children: [],
          direction: null,
        },
      },
    }
  ) {
    super(key);
    this.__src = src;
    this.__alt = alt;
    this.__width = width;
    this.__height = height;
    this.__maxWidth = maxWidth;
    this.__showCaption = showCaption;
    this.__caption = caption;
  }

  createDOM(): HTMLElement {
    const img = document.createElement("img");
    img.src = this.__src;
    if (this.__alt) img.alt = this.__alt;
    if (this.__width) img.width = this.__width;
    if (this.__height) img.height = this.__height;
    return img;
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { src, alt, width, height } = serializedNode;
    return new ImageNode(src, alt, width, height);
  }

  exportJSON(): {
    src: string;
    type: string;
    width?: number;
    height?: number;
    altText?: string;
    caption?: ImageCaption;
    version: number;
    maxWidth?: number;
    showCaption?: boolean;
  } {
    return {
      src: this.__src,
      type: "image",
      width: this.__width,
      height: this.__height,
      altText: this.__alt,
      caption: this.__caption,
      version: 1,
      maxWidth: this.__maxWidth,
      showCaption: this.__showCaption,
    };
  }

  decorate(): null {
    return null;
  }
}
