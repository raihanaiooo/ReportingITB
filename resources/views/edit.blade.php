<!-- resources/views/licenses/edit.blade.php -->
@extends('layouts.app')
@section('content')
    <div class="container">
        <h2>Edit License</h2>
        <form action="{{ route('licenses.update', $license) }}" method="POST">
            @csrf
            @method('PUT')

            <div class="form-group">
                <label for="total">Total:</label>
                <input type="number" name="total" class="form-control" value="{{ $license->total }}" required>
            </div>

            <div class="form-group">
                <label for="used">Used:</label>
                <input type="number" name="used" class="form-control" value="{{ $license->used }}" required>
            </div>

            <div class="form-group">
                <label for="available">Available:</label>
                <input type="number" name="available" class="form-control" value="{{ $license->available }}" required>
            </div>

            <div class="form-group">
                <label for="app_type_id">App Type:</label>
                <select name="app_type_id" class="form-control" required>
                    @foreach($apps as $app)
                        <option value="{{ $app->id }}" {{ $license->app_type_id == $app->id ? 'selected' : '' }}>
                            {{ $app->name }}
                        </option>
                    @endforeach
                </select>
            </div>

            <button type="submit" class="btn btn-primary">Update License</button>
        </form>
    </div>
@endsection
