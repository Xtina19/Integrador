package ui.component;

import java.util.Objects;

/**
 * Elemento de combo con ID interno y etiqueta legible.
 */
public class ComboItem<T> {

    private final T id;
    private final String label;

    public ComboItem(T id, String label) {
        this.id = id;
        this.label = label;
    }

    public T getId() {
        return id;
    }

    public String getLabel() {
        return label;
    }

    @Override
    public String toString() {
        return label;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof ComboItem<?> that)) {
            return false;
        }
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
