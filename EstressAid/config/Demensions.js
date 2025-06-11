import { Dimensions } from 'react-native';

export const { width, height } = Dimensions.get('window');

export function adaptToWidth(x) {
    return width * x
}
export function adaptToHeight(y) {
    return height * y
}