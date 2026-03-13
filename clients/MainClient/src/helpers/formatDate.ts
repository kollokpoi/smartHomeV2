export const formatDate = (dateInput?: Date | string): string => {
    if(!dateInput)
        return "-"
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput)

    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })
}