import { DecoratorNode, EditorConfig, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from "lexical";

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

  static getType(): string {
    return "image";
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__alt, node.__width, node.__height, node.__key);
  }

  constructor(src: string, alt?: string, width?: number, height?: number, key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__alt = alt;
    this.__width = width;
    this.__height = height;
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

  exportJSON(): SerializedImageNode {
    return {
      type: "image",
      version: 1,
      src: this.__src,
      alt: this.__alt,
      width: this.__width,
      height: this.__height,
    };
  }

  decorate(): null {
    return null;
  }
}
