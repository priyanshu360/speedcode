
export class TypingSession {
	typedText: string = "";
	targetText: string;

	constructor(text: string) {
		this.targetText = text;
	}

	addCharacter(ch: string): void {
		if (this.isComplete()) {
			return;
		}
		this.typedText += ch;
	}

	removeCharacter(): void {
		if (this.typedText.length === 0) {
			return;
		}
		this.typedText = this.typedText.slice(0, -1);
	}

	getCurrentInput(): string {
		return this.typedText;
	}

	isComplete(): boolean {
		return this.typedText.length === this.targetText.length;
	}

	getMistakeCount(): number {
		let mistakes = 0;
		for (let i = 0; i < this.typedText.length; i++) {
			if (this.typedText[i] !== this.targetText[i]) {
				mistakes++;
			}
		}
		return mistakes;
	}

	getAccuracy(): number {
		if (this.typedText.length === 0) {
			return 100;
		}
		const correct = this.typedText.length - this.getMistakeCount();
		return (correct / this.typedText.length) * 100;
	}
}
