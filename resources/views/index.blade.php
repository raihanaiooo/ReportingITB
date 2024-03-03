<!-- resources/views/licenses/index.blade.php -->
@extends('layouts.app')

@section('content')
    <div class="container">
        <h2>Licenses List</h2>
        
        @if(session('success'))
            <div class="alert alert-success">
                {{ session('success') }}
            </div>
        @endif

        <table class="table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Total</th>
                    <th>Used</th>
                    <th>Available</th>
                    <th>App Type</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                @foreach($licenses as $license)
                    <tr>
                        <td>{{ $license->id }}</td>
                        <td>{{ $license->total }}</td>
                        <td>{{ $license->used }}</td>
                        <td>{{ $license->available }}</td>
                        <td>{{ $license->app->name }}</td>
                        <td>
                            <a href="{{ route('licenses.edit', $license) }}" class="btn btn-primary">Edit</a>
                            <form action="{{ route('licenses.destroy', $license) }}" method="POST" style="display: inline;">
                                @csrf
                                @method('DELETE')
                                <button type="submit" class="btn btn-danger" onclick="return confirm('Are you sure?')">Delete</button>
                            </form>
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>
@endsection
