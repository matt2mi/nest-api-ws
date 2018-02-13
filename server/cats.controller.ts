import { Body, Controller, Get, HttpStatus, Post, Res } from '@nestjs/common';

export class CreateCatDto {
    readonly name: string;
}

@Controller('api/cats')
export class CatsController {
    cats = [{name: 'cat1'}, {name: 'cat2'}];

    @Post('create')
    create(@Res() response, @Body() createCatDto: CreateCatDto) {
        console.log('welcome ', createCatDto.name, '!');
        this.cats.push(createCatDto);
        return response.status(HttpStatus.CREATED).json(this.cats);
    }

    @Get('findAll')
    findAll(@Res() response) {
        return response.status(HttpStatus.OK).json(this.cats);
    }
}