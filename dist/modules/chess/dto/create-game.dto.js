var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
class TimeControlDto {
    initialSeconds;
    incrementSeconds;
}
__decorate([
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], TimeControlDto.prototype, "initialSeconds", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    __metadata("design:type", Number)
], TimeControlDto.prototype, "incrementSeconds", void 0);
export class CreateGameDto {
    mode;
    fen;
    aiColor;
    timeControl;
}
__decorate([
    IsOptional(),
    IsIn(['pvp', 'pve']),
    __metadata("design:type", String)
], CreateGameDto.prototype, "mode", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateGameDto.prototype, "fen", void 0);
__decorate([
    IsOptional(),
    IsIn(['w', 'b']),
    __metadata("design:type", String)
], CreateGameDto.prototype, "aiColor", void 0);
__decorate([
    IsOptional(),
    IsObject(),
    ValidateNested(),
    Type(() => TimeControlDto),
    __metadata("design:type", TimeControlDto)
], CreateGameDto.prototype, "timeControl", void 0);
//# sourceMappingURL=create-game.dto.js.map