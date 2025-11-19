class UIManager {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        this.originalWidth = this.canvas.width;
        this.originalHeight = this.canvas.height;

        this.floatStart = performance.now();

        this.scaleX = 1;
        this.scaleY = 1;

        this.infoButtonArea = null;
        this.closeButtonArea = null;

        this.updateScale();
        window.addEventListener('resize', () => this.updateScale());
    }

    // =====================
    // Scaling & Input
    // =====================

    updateScale() {
        const displayWidth = this.canvas.clientWidth;
        const displayHeight = this.canvas.clientHeight;

        this.scaleX = displayWidth / this.originalWidth;
        this.scaleY = displayHeight / this.originalHeight;
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.clientX;
        const clientY = e.clientY;

        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    getTouchPos(touchEvent) {
        const rect = this.canvas.getBoundingClientRect();
        const touch = touchEvent.touches[0];

        const x = (touch.clientX - rect.left) / this.scaleX;
        const y = (touch.clientY - rect.top) / this.scaleY;

        return { x, y };
    }

    // =====================
    // Core Game Drawing
    // =====================

    drawGame(bins, activeItems, draggedItem, spawnArea) {
        if (this.game && this.game.playzoneBg && this.game.playzoneBg.complete) {
            this.ctx.drawImage(
                this.game.playzoneBg,
                0,
                0,
                this.canvas.width,
                this.canvas.height
            );
        }

        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.globalAlpha = 1.0;

        bins.forEach(bin => {
            this.drawBinWithAnimation(bin);
        });

        if (this.itemManager && typeof this.itemManager.drawParticles === 'function') {
            this.itemManager.drawParticles(this.ctx);
        }

        activeItems.forEach(item => {
            if (draggedItem && draggedItem.id === item.id) return;
            this.drawItem(item);
        });

        if (draggedItem) {
            this.drawItem(draggedItem, true);

            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;

            this.ctx.font = '20px Arial';
            this.ctx.fillStyle = 'white';
            this.ctx.strokeStyle = 'black';
            this.ctx.lineWidth = 3;

            const textY = draggedItem.y + draggedItem.height / 2 + 20;
            this.ctx.strokeText(draggedItem.name, draggedItem.x, textY);
            this.ctx.fillText(draggedItem.name, draggedItem.x, textY);
        }

        this.drawBranchesOverlay();

        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.globalAlpha = 1.0;
    }

    drawBranchesOverlay() {
        if (!this.game) return;

        const topImg = this.game.branchesTopImg;
        const bottomImg = this.game.branchesBottomImg;
        const anim = this.game.branchesAnim;

        if (!topImg || !bottomImg || !anim) return;
        if (!topImg.complete || !bottomImg.complete) return;

        const now = performance.now();
        const duration = anim.duration || 800;
        const bottomDelay = anim.bottomDelay || 1000;

        const tRawTop = Math.max(0, Math.min(1, (now - anim.startTime) / duration));
        const tTop = 1 - Math.pow(1 - tRawTop, 3);

        const tRawBottom = Math.max(
            0,
            Math.min(1, (now - (anim.startTime + bottomDelay)) / duration)
        );
        const tBottom = 1 - Math.pow(1 - tRawBottom, 3);

        const w = this.canvas.width;
        const h = this.canvas.height;

        const topStartY = -h;
        const topTargetY = 0;
        const topY = topStartY + (topTargetY - topStartY) * tTop;

        const bottomStartY = h;
        const bottomTargetY = 0;
        const bottomY = bottomStartY + (bottomTargetY - bottomStartY) * tBottom;

        if (tRawTop > 0) {
            this.ctx.save();
            this.ctx.globalAlpha = tTop;
            this.ctx.drawImage(topImg, 0, topY, w, h);
            this.ctx.restore();
        }

        if (tRawBottom > 0) {
            this.ctx.save();
            this.ctx.globalAlpha = tBottom;
            this.ctx.drawImage(bottomImg, 0, bottomY, w, h);
            this.ctx.restore();
        }
    }

    drawBinWithAnimation(bin) {
        const closedImage = document.getElementById(bin.imageId);
        const openImage = bin.openImageId ? document.getElementById(bin.openImageId) : null;

        if (!closedImage) {
            this.ctx.fillStyle = bin.color;
            this.ctx.fillRect(bin.x, bin.y, bin.fixedWidth, bin.currentHeight);
            return;
        }

        const useOpenImage = bin.hasOpenAnimation && bin.openProgress > 0.5 && openImage;
        const image = useOpenImage ? openImage : closedImage;

        this.ctx.drawImage(
            image,
            bin.x,
            bin.y,
            bin.fixedWidth,
            bin.currentHeight
        );
    }

    drawItem(item, isDragged = false) {
        const itemImage = document.getElementById(item.imageId);

        const isBroken =
            !itemImage ||
            !itemImage.complete ||
            itemImage.naturalWidth === 0 ||
            itemImage.naturalHeight === 0;

        if (isBroken) {
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            if (isDragged) {
                this.ctx.shadowColor = 'rgba(255,255,255,0.8)';
                this.ctx.shadowBlur = 10;
            }

            this.ctx.fillText('📦', item.x, item.y); // if the image of the object was matin / not found (Just in case)

            if (isDragged) {
                this.ctx.shadowColor = 'transparent';
                this.ctx.shadowBlur = 0;
            }

            return;
        }

        if (isDragged) {
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            this.ctx.shadowBlur = 10;
        }

        this.ctx.drawImage(
            itemImage,
            item.x - item.width / 2,
            item.y - item.height / 2,
            item.width,
            item.height
        );

        if (isDragged) {
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
        }
    }

    // =====================
    // Dialogs
    // =====================

    drawDialog(message, isError = false, onInfoClick = null) {
        const ctx = this.ctx;
        const canvas = this.canvas;

        let offsetY = 0;
        let alpha = 1;

        if (this.game && this.game.dialogAnim && this.game.dialogAnim.state === 'in') {
            const a = this.game.dialogAnim;
            const now = performance.now();
            const raw = Math.max(0, Math.min(1, (now - a.startTime) / a.duration));

            const t = this.game && typeof this.game.easeOutCubic === 'function'
                ? this.game.easeOutCubic(raw)
                : 1 - Math.pow(1 - raw, 3);

            offsetY = canvas.height * (1 - t);
            alpha = t;
        }

        ctx.save();
        ctx.globalAlpha = 0.7 * alpha;
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = alpha;

        if (this.game && this.game.dialogPanelImg && this.game.dialogPanelImg.complete) {
            ctx.drawImage(
                this.game.dialogPanelImg,
                0,
                offsetY,
                canvas.width,
                canvas.height
            );
        } else {
            ctx.fillStyle = 'rgba(231, 76, 60, 0.9)';
            ctx.fillRect(0, offsetY, canvas.width, canvas.height);
        }

        const padding = 20;
        const lineHeight = 22;

        const boxWidth = canvas.width - 140;
        const boxX = 70;

        const iconBlockWidth = 80;
        const rightReserved = onInfoClick ? 70 : 20;

        const textAreaWidth = boxWidth - iconBlockWidth - rightReserved - 160;
        const maxTextWidth = textAreaWidth;

        const tempLines = this.wrapText(message, maxTextWidth);
        const textHeight = tempLines.length * lineHeight;

        const boxHeight = Math.max(120, textHeight + padding * 2 + 10);
        const boxY = offsetY + canvas.height - boxHeight - 70;

        ctx.save();
        ctx.beginPath();
        const r = 16;
        ctx.moveTo(boxX + r, boxY);
        ctx.lineTo(boxX + boxWidth - r, boxY);
        ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + r);
        ctx.lineTo(boxX + boxWidth, boxY + boxHeight - r);
        ctx.quadraticCurveTo(
            boxX + boxWidth,
            boxY + boxHeight,
            boxX + boxWidth - r,
            boxY + boxHeight
        );
        ctx.lineTo(boxX + r, boxY + boxHeight);
        ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - r);
        ctx.lineTo(boxX, boxY + r);
        ctx.quadraticCurveTo(boxX, boxY, boxX + r, boxY);
        ctx.closePath();

        let grad = ctx.createLinearGradient(boxX, 0, boxX + boxWidth, 0);
        grad.addColorStop(0.0, 'rgba(255, 0, 0, 0.3)');
        grad.addColorStop(0.3, 'rgba(48, 0, 0, 0.4)');
        grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.5)');

        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();

        const lines = this.wrapText(message, maxTextWidth);

        ctx.fillStyle = 'white';
        ctx.font = '18px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        const textLeftX = boxX + iconBlockWidth;
        const textTopY = boxY + (boxHeight - textHeight) / 2;

        lines.forEach((line, index) => {
            ctx.fillText(line, textLeftX, textTopY + index * lineHeight);
        });

        if (onInfoClick) {
            const infoX = boxX + boxWidth - rightReserved / 2;
            const infoY = boxY + boxHeight / 2;
            this.drawInfoButton(infoX, infoY, onInfoClick);
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '19px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(
            'Noklikšķiniet, lai turpinātu',
            canvas.width / 2,
            offsetY + canvas.height - 25
        );

        ctx.restore();
    }

    drawInfoButton(x, y, onClick) {
        const ctx = this.ctx;

        this.infoButtonArea = { x: x - 20, y: y - 20, width: 40, height: 50 };

        const gradient = ctx.createLinearGradient(x - 22, y, x + 22, y);
        gradient.addColorStop(0.3, '#3498dbd5');
        gradient.addColorStop(1, '#003151d5');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, 22, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.font = 'bold 25px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('i', x, y);
    }

    drawConsequenceDialog(item, correctBin, onClose) {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const consequence = item.consequence;

        const dialogWidth = 640;
        const dialogHeight = 420;
        const x = (canvas.width - dialogWidth) / 2;
        const y = (canvas.height - dialogHeight) / 2;
        const padding = 20;

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();

        const infoPaperImg =
            this.game && this.game.infoPaperImg && this.game.infoPaperImg.complete
                ? this.game.infoPaperImg
                : null;

        if (infoPaperImg) {
            ctx.drawImage(
                infoPaperImg,
                x - 70,
                y - 50,
                dialogWidth + 110,
                dialogHeight + 110
            );
        }

        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const titleText = 'Ekoloģiskās sekas';
        const titleX = x + dialogWidth / 2;
        const titleY = y + padding - 10;

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.33)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;

        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.strokeText(titleText, titleX, titleY);

        ctx.fillStyle = 'white';
        ctx.fillText(titleText, titleX, titleY);


        const contentTopOffset = 70;

        // Left column
        const leftBlockY = y + contentTopOffset;
        const leftBlockWidth = 190;

        const itemImage = document.getElementById(item.imageId);
        const tapeImg =
            this.game && this.game.tapeImg && this.game.tapeImg.complete
                ? this.game.tapeImg
                : null;

        const floatTime = (performance.now() - this.floatStart) * 0.002;
        const floatOffset = Math.sin(floatTime) * 5;

        if (itemImage) {
            const aspectRatio =
                item.height && item.width ? item.height / item.width : 1;
            const imgW = 80;
            const imgH = imgW * aspectRatio;

            const centerX = x + padding + leftBlockWidth / 2;
            const centerY = leftBlockY + imgH / 2;

            if (tapeImg) {
                const tapeScale = 1.6;
                const tapeW = imgW * tapeScale;
                const tapeH = tapeW * (tapeImg.naturalHeight / tapeImg.naturalWidth);

                ctx.drawImage(
                    itemImage,
                    centerX - imgW / 2,
                    centerY - imgH / 2 + floatOffset,
                    imgW,
                    imgH
                );
                ctx.drawImage(
                    tapeImg,
                    centerX - tapeW / 2,
                    centerY - tapeH / 2,
                    tapeW,
                    tapeH
                );
            }
        }

        ctx.fillStyle = '#000000ff';
        ctx.font = 'bold 23px Arial';
        ctx.textAlign = 'center';

        const nameLines = this.wrapText(item.name, leftBlockWidth - 20);
        const lineHeightName = 26;
        const firstLineY = leftBlockY + 120;

        let maxNameWidth = 0;
        nameLines.forEach(line => {
            const w = ctx.measureText(line).width;
            if (w > maxNameWidth) maxNameWidth = w;
        });

        const paddingX = 10;
        const paddingY = 6;

        const boxCenterX = x + padding + leftBlockWidth / 2;
        const boxX = boxCenterX - maxNameWidth / 2 - paddingX;
        const boxY = firstLineY - paddingY;
        const boxWidth = maxNameWidth + paddingX * 2;
        const boxHeight = nameLines.length * lineHeightName + paddingY * 2;

        ctx.save();
        ctx.fillStyle = '#ffffffa4';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        ctx.restore();

        ctx.fillStyle = '#000000ff';
        nameLines.forEach((line, index) => {
            ctx.fillText(line, boxCenterX, firstLineY + index * lineHeightName);
        });

        // Right column
        const rightX = x + padding + leftBlockWidth;
        const rightWidth = dialogWidth - (rightX - x) - padding;
        const rightTopY = y + contentTopOffset - 10;

        ctx.fillStyle = '#b61200ff';
        ctx.font = 'bold 19px Arial';
        ctx.textAlign = 'left';

        const effectMaxWidth = rightWidth - 80;
        const effectLines = this.wrapText(
            `Efekts: ${consequence.effect}`,
            effectMaxWidth
        );

        effectLines.forEach((line, index) => {
            ctx.fillText(line, rightX, rightTopY + index * 20);
        });

        const impactBarY = rightTopY + 90;

        this.drawImpactBar(
            rightX,
            impactBarY,
            rightWidth - 70,
            40,
            consequence.impact
        );

        const impactLabel = `Ietekmes līmenis: ${consequence.impact}`;
        const barCenterX = rightX + (rightWidth - 50) / 2;
        const barCenterY = impactBarY + 45 / 2;

        ctx.fillStyle = '#282828ff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(impactLabel, barCenterX, barCenterY);

        const textBlockX = rightX;
        const textBlockWidth = rightWidth - 80;

        ctx.fillStyle = '#000000ff';
        ctx.font = '19px Arial';
        ctx.textAlign = 'left';

        const consequenceLines = this.wrapText(
            consequence.text,
            textBlockWidth
        );

        consequenceLines.forEach((line, index) => {
            ctx.fillText(line, textBlockX, impactBarY + 65 + index * 20);
        });

        if (correctBin) {
            let miniImgId = correctBin.miniImageId;
            if (!miniImgId) {
                const miniMap = {
                    black: 'mini-black-bin',
                    yellow: 'mini-yellow-bin',
                    green: 'mini-green-bin',
                    brown: 'mini-brown-bin',
                    blue: 'mini-blue-bin',
                    red: 'mini-orange-bin'
                };
                miniImgId = miniMap[correctBin.type];
            }

            const miniImg = miniImgId ? document.getElementById(miniImgId) : null;

            const rowY = y + dialogHeight - 50;
            const centerX = canvas.width / 2;

            const containerName = correctBin.name || '';
            const label = 'Jāizmet:';

            ctx.font = '22px Arial';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';

            const spacing = 10;
            const iconSize = 50;

            const textFull = `${label} ${containerName}`;
            const textWidth = ctx.measureText(textFull).width;

            const totalWidth = textWidth + (miniImg ? spacing + iconSize : 0);
            const startX = centerX - totalWidth / 2;

            let currentX = startX;

            ctx.fillStyle = '#000000ff';
            ctx.fillText(textFull, currentX, rowY);
            currentX += textWidth;

            if (miniImg && miniImg.complete && miniImg.naturalWidth > 0) {
                const iconY = rowY - iconSize / 2;
                currentX += spacing;

                ctx.save();
                ctx.globalAlpha = 0.65; // mini-bin alpha
                ctx.drawImage(miniImg, currentX, iconY, iconSize, iconSize);
                ctx.restore();
            }
        }

        ctx.fillStyle = '#7f8c8d';
        ctx.font = '19px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(
            'Noklikšķiniet, lai aizvērtu',
            canvas.width / 2,
            y + dialogHeight + 10
        );
    }

    drawCloseButton(x, y, onClick) {
        const ctx = this.ctx;

        this.closeButtonArea = { x: x - 15, y: y - 15, width: 30, height: 30 };

        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('×', x, y);
    }

    // =====================
    // Impact Bar / Colors
    // =====================

    drawImpactBar(x, y, width, height, impactLabel) {
        const ctx = this.ctx;

        const level = (() => {
            switch (impactLabel) {
                case 'Kritisks': return 5;
                case 'Ļoti augsts': return 4;
                case 'Augsts': return 3;
                case 'Vidēji': return 2;
                case 'Viegli': return 1;
                default: return 2;
            }
        })();

        const maxLevel = 5;
        const fillWidth = (width * level) / maxLevel;

        this.drawRoundedRect(
            ctx,
            x,
            y,
            width,
            height,
            height / 2,
            'rgba(0,0,0,0.06)'
        );

        const grad = ctx.createLinearGradient(x, y, x + width, y);
        grad.addColorStop(0, '#2ecc71');
        grad.addColorStop(0.5, '#f1c40f');
        grad.addColorStop(1, '#e74c3c');

        this.drawRoundedRect(
            ctx,
            x,
            y,
            fillWidth,
            height,
            height / 2,
            grad
        );

        ctx.save();
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + height / 2, y);
        ctx.lineTo(x + width - height / 2, y);
        ctx.arc(
            x + width - height / 2,
            y + height / 2,
            height / 2,
            -Math.PI / 2,
            Math.PI / 2
        );
        ctx.lineTo(x + height / 2, y + height);
        ctx.arc(
            x + height / 2,
            y + height / 2,
            height / 2,
            Math.PI / 2,
            -Math.PI / 2
        );
        ctx.stroke();
        ctx.restore();
    }

    getImpactColor(impact) {
        switch (impact) {
            case 'Kritisks': return '#c0392b';
            case 'Ļoti augsts': return '#e74c3c';
            case 'Augsts': return '#e67e22';
            case 'Vidēji': return '#f39c12';
            case 'Viegli': return '#27ae60';
            default: return '#7f8c8d';
        }
    }

    // =====================
    // Geometry / Utils
    // =====================

    drawRoundedRect(ctx, x, y, width, height, radius, fillStyle) {
        const r = Math.min(radius, width / 2, height / 2);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + width - r, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + r);
        ctx.lineTo(x + width, y + height - r);
        ctx.quadraticCurveTo(
            x + width,
            y + height,
            x + width - r,
            y + height
        );
        ctx.lineTo(x + r, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();

        if (typeof fillStyle === 'string' || fillStyle instanceof CanvasGradient) {
            ctx.fillStyle = fillStyle;
            ctx.fill();
        }

        ctx.restore();
    }

    hexOrColor(color) {
        if (!color) return '#3498db';
        if (color.startsWith('rgb') || !color.startsWith('#')) return color;
        return color;
    }

    wrapText(text, maxWidth) {
        const words = text.split(' ');
        const lines = [];

        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = this.ctx.measureText(currentLine + ' ' + word).width;

            if (width < maxWidth) {
                currentLine += ' ' + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }

        lines.push(currentLine);
        return lines;
    }

    // =====================
    // Hit Tests & Score
    // =====================

    isClickOnInfoButton(x, y) {
        if (!this.infoButtonArea) return false;

        return (
            x >= this.infoButtonArea.x &&
            x <= this.infoButtonArea.x + this.infoButtonArea.width &&
            y >= this.infoButtonArea.y &&
            y <= this.infoButtonArea.y + this.infoButtonArea.height
        );
    }

    isClickOnCloseButton(x, y) {
        if (!this.closeButtonArea) return false;

        return (
            x >= this.closeButtonArea.x &&
            x <= this.closeButtonArea.x + this.closeButtonArea.width &&
            y >= this.closeButtonArea.y &&
            y <= this.closeButtonArea.y + this.closeButtonArea.height
        );
    }

    updateScore(score) {
        document.getElementById('score').textContent = `Rezultāts: ${score}`;
    }
}
